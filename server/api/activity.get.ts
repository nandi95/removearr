export default defineEventHandler(async event => {
    const { limit } = getQuery(event);
    const [events, freed, runs] = await Promise.all([listActivity(Number(limit) || 100), freedBytes(), listSyncRuns()]);

    return { events, freedBytes: freed, runs };
});
