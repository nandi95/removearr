import { Cron } from 'croner';
import { fetch } from 'undici';

// node 24's bundled undici 7 dies with assert(!this.paused) when an upstream closes mid-body (nodejs/undici#5360),
// and everything (arr/tautulli JSON, @ctrl/plex, the art proxy) goes through global fetch. undici 8 has the fix.
globalThis.fetch = fetch as unknown as typeof globalThis.fetch;

export default defineNitroPlugin(async () => {
    // importing config already fail-fasts on missing env
    // nitro swallows plugin rejections, so a dead sqlite (e.g. unwritable volume) would otherwise serve happily
    await initDb().catch(e => {
        log.error('cannot open sqlite database', e);
        process.exit(1);
    });
    scheduler.job = new Cron(config.cronSchedule, () => {
        runTask('sync');
    });
    log.info(`sync scheduled "${config.cronSchedule}", next run ${nextRun()}`);
});
