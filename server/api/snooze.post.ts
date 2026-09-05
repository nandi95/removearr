import type { Kind } from '#shared/types';

export default defineEventHandler(async event => {
    const body = await readBody<{ kind: Kind; id: number; seasonNumber?: number; until: string | null }>(event);

    if (!['movie', 'series'].includes(body?.kind) || !Number.isInteger(body.id)) {
        throw createError({ statusCode: 400, message: 'kind and id required' });
    }

    await upsertSnooze({ kind: body.kind, arrId: body.id, seasonNumber: body.seasonNumber ?? -1, until: body.until ?? null });

    return { ok: true };
});
