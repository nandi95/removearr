export type Status = 'keep' | 'soon' | 'deletable' | 'snoozed';
export type Kind = 'movie' | 'series';

export interface LibraryMovie {
    id: number;
    title: string;
    year: number;
    size: number;
    added: string;
    /** Tautulli rating key, needed for the Plex collection sync. */
    ratingKey: number | null;
    /** Unix seconds of the last play by anyone. */
    lastPlayed: number | null;
    requestedBy: string | null;
    /** Users who fully watched it. */
    watchedBy: string[];
    status: Status;
}

export interface LibrarySeason {
    seasonNumber: number;
    size: number;
    episodes: number;
    /** Unix seconds of the last activity on the season by anyone, partial or full. */
    lastActivity: number | null;
    /** Users who fully watched at least as many distinct episodes as there are files. */
    watchedBy: string[];
    status: Status;
}

export interface LibrarySeries {
    id: number;
    title: string;
    year: number;
    size: number;
    added: string;
    lastPlayed: number | null;
    requestedBy: string | null;
    watchedBy: string[];
    seasons: LibrarySeason[];
    /** Worst season status. */
    status: Status;
}

export interface Library {
    movies: LibraryMovie[];
    series: LibrarySeries[];
}

export interface SyncRun {
    id: number;
    at: string;
    ok: boolean;
    error: string | null;
    deletableCount: number;
    soonCount: number;
    deletableBytes: number;
    soonBytes: number;
    libraryBytes: number;
    plexAdded: number;
    plexRemoved: number;
}

export interface Deletion {
    id: number;
    at: string;
    kind: Kind;
    arrId: number;
    title: string;
    year: number;
    seasonNumber: number | null;
    sizeBytes: number;
    requestedBy: string | null;
}

export interface Snooze {
    kind: Kind;
    arrId: number;
    /** -1 for a whole movie / series. */
    seasonNumber: number;
    /** ISO date; null = keep forever. */
    until: string | null;
    createdAt: string;
}

export type ActivityEvent
    = | { type: 'sync'; at: string; run: SyncRun }
        | { type: 'deletion'; at: string; deletion: Deletion };

export interface LibraryResponse extends Library {
    lastSync: SyncRun | null;
    nextRun: string | null;
    deleteAfterDays: number;
}
