import { Cron } from 'croner';

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
