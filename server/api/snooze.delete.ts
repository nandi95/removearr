import type { Kind } from '#shared/types';

export default defineEventHandler(async event => {
    const body = await readBody<{ kind: Kind; id: number; seasonNumber?: number }>(event);

    if (!['movie', 'series'].includes(body?.kind) || !Number.isInteger(body.id)) {
        throw createError({ statusCode: 400, message: 'kind and id required' });
    }

    await deleteSnooze(body.kind, body.id, body.seasonNumber ?? -1);

    return { ok: true };
});
