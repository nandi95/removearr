import { Cron } from 'croner';

export default defineNitroPlugin(async () => {
    // importing config already fail-fasts on missing env
    await initDb();
    scheduler.job = new Cron(config.cronSchedule, () => {
        runTask('sync');
    });
    log.info(`sync scheduled "${config.cronSchedule}", next run ${nextRun()}`);
});
