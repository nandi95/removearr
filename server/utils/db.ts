import type { ActivityEvent, Deletion, Snooze, SyncRun } from '#shared/types';

export async function initDb() {
    const db = useDatabase();

    await db.sql`CREATE TABLE IF NOT EXISTS sync_runs (
    id INTEGER PRIMARY KEY, at TEXT NOT NULL, ok INTEGER NOT NULL, error TEXT,
    deletable_count INTEGER DEFAULT 0, soon_count INTEGER DEFAULT 0,
    deletable_bytes INTEGER DEFAULT 0, soon_bytes INTEGER DEFAULT 0, library_bytes INTEGER DEFAULT 0,
    plex_added INTEGER DEFAULT 0, plex_removed INTEGER DEFAULT 0
  )`;
    await db.sql`CREATE TABLE IF NOT EXISTS deletions (
    id INTEGER PRIMARY KEY, at TEXT NOT NULL, kind TEXT NOT NULL, arr_id INTEGER NOT NULL,
    title TEXT NOT NULL, year INTEGER, season_number INTEGER, size_bytes INTEGER NOT NULL, requested_by TEXT
  )`;
    await db.sql`CREATE TABLE IF NOT EXISTS snoozes (
    kind TEXT NOT NULL, arr_id INTEGER NOT NULL, season_number INTEGER NOT NULL DEFAULT -1,
    until TEXT, created_at TEXT NOT NULL, PRIMARY KEY (kind, arr_id, season_number)
  )`;
}

type Row = Record<string, any>;

const toSyncRun = (r: Row): SyncRun => ({
    id: r.id, at: r.at, ok: !!r.ok, error: r.error ?? null,
    deletableCount: r.deletable_count, soonCount: r.soon_count,
    deletableBytes: r.deletable_bytes, soonBytes: r.soon_bytes, libraryBytes: r.library_bytes,
    plexAdded: r.plex_added, plexRemoved: r.plex_removed
});

const toDeletion = (r: Row): Deletion => ({
    id: r.id, at: r.at, kind: r.kind, arrId: r.arr_id, title: r.title, year: r.year,
    seasonNumber: r.season_number ?? null, sizeBytes: r.size_bytes, requestedBy: r.requested_by ?? null
});

const toSnooze = (r: Row): Snooze => ({
    kind: r.kind, arrId: r.arr_id, seasonNumber: r.season_number, until: r.until ?? null, createdAt: r.created_at
});

export async function recordSync(run: Omit<SyncRun, 'id'>): Promise<SyncRun> {
    const db = useDatabase();
    await db.sql`INSERT INTO sync_runs (at, ok, error, deletable_count, soon_count, deletable_bytes, soon_bytes, library_bytes, plex_added, plex_removed)
    VALUES (${run.at}, ${run.ok ? 1 : 0}, ${run.error}, ${run.deletableCount}, ${run.soonCount}, ${run.deletableBytes}, ${run.soonBytes}, ${run.libraryBytes}, ${run.plexAdded}, ${run.plexRemoved})`;
    const { rows } = await db.sql`SELECT * FROM sync_runs ORDER BY id DESC LIMIT 1`;

    return toSyncRun(rows![0]!);
}

export async function lastSync(): Promise<SyncRun | null> {
    const { rows } = await useDatabase().sql`SELECT * FROM sync_runs ORDER BY id DESC LIMIT 1`;

    return rows?.[0] ? toSyncRun(rows[0]) : null;
}

export async function listSyncRuns(limit = 30): Promise<SyncRun[]> {
    const { rows } = await useDatabase().sql`SELECT * FROM sync_runs WHERE ok = 1 ORDER BY id DESC LIMIT ${limit}`;

    return (rows ?? []).map(toSyncRun).reverse();
}

export async function recordDeletion(d: Omit<Deletion, 'id' | 'at'>) {
    await useDatabase().sql`INSERT INTO deletions (at, kind, arr_id, title, year, season_number, size_bytes, requested_by)
    VALUES (${new Date().toISOString()}, ${d.kind}, ${d.arrId}, ${d.title}, ${d.year}, ${d.seasonNumber}, ${d.sizeBytes}, ${d.requestedBy})`;
}

export async function freedBytes(): Promise<number> {
    const { rows } = await useDatabase().sql`SELECT COALESCE(SUM(size_bytes), 0) AS total FROM deletions`;

    return Number(rows?.[0]?.total ?? 0);
}

export async function listSnoozes(): Promise<Snooze[]> {
    const { rows } = await useDatabase().sql`SELECT * FROM snoozes`;

    return (rows ?? []).map(toSnooze);
}

export async function upsertSnooze(s: Omit<Snooze, 'createdAt'>) {
    await useDatabase().sql`INSERT INTO snoozes (kind, arr_id, season_number, until, created_at)
    VALUES (${s.kind}, ${s.arrId}, ${s.seasonNumber}, ${s.until}, ${new Date().toISOString()})
    ON CONFLICT (kind, arr_id, season_number) DO UPDATE SET until = excluded.until, created_at = excluded.created_at`;
}

export async function deleteSnooze(kind: string, arrId: number, seasonNumber = -1) {
    await useDatabase().sql`DELETE FROM snoozes WHERE kind = ${kind} AND arr_id = ${arrId} AND season_number = ${seasonNumber}`;
}

export async function pruneSnoozes() {
    await useDatabase().sql`DELETE FROM snoozes WHERE until IS NOT NULL AND until < ${new Date().toISOString()}`;
}

export async function listActivity(limit = 100): Promise<ActivityEvent[]> {
    const db = useDatabase();
    const [runs, deletions] = await Promise.all([
        db.sql`SELECT * FROM sync_runs ORDER BY id DESC LIMIT ${limit}`,
        db.sql`SELECT * FROM deletions ORDER BY id DESC LIMIT ${limit}`
    ]);

    return [
        ...(runs.rows ?? []).map(r => ({ type: 'sync' as const, at: r.at as string, run: toSyncRun(r) })),
        ...(deletions.rows ?? []).map(r => ({ type: 'deletion' as const, at: r.at as string, deletion: toDeletion(r) }))
    ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}
