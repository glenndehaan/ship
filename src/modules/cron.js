/**
 * Import vendor modules
 */
const {CronJob} = require('cron');

/**
 * Define global variables
 */
const recordsToKeep = 100;
const crons = [];

/**
 * Exports the cron module
 */
module.exports = {
    /**
     * Starts all crons
     *
     * @param db
     * @param log
     */
    start: (db, log) => {
        log.info('[CRON] Enabled!');
        log.info(`[CRON] Cleaning up database at 01:00:00, keeping the last ${recordsToKeep} record(s)!`);

        crons.push(new CronJob('0 0 1 * * *', () => {
            log.info('[CRON] Starting database cleanup...');
            const logAmount = db.count('/logs');
            log.info(`[CRON] Found ${logAmount} log entries`);

            if(logAmount > recordsToKeep) {
                const logsRaw = db.getData('/logs');
                const logs = JSON.parse(JSON.stringify(logsRaw)); // Remove reference to JSON DB, since this would mess-up the in-memory version
                const newLogs = logs.sort((a, b) => b.time - a.time).splice(0, recordsToKeep);

                db.push('/logs', newLogs);
                log.info(`[CRON] Cleanup complete removed ${logs.length} entries!`);
            } else {
                log.info(`[CRON] No cleanup needed!`);
            }
        }, null, true));
    },

    /**
     * Stops all crons
     */
    stop: () => {
        for(let item = 0; item < crons.length; item++) {
            crons[item].stop();
        }
    }
};
