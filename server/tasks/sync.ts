export default defineTask({
    meta: { name: 'sync', description: 'Compute candidates and sync the Plex "Leaving Soon" collection' },
    run: async () => ({ result: await runSync() })
});
