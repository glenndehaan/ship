/**
 * Import vendor modules
 */
const fetch = require('node-fetch');

/**
 * Import own modules
 */
const shutdown = require('./modules/shutdown');
const log = require('./modules/logger');
const docker = require('./modules/docker');

/**
 * Global variables
 */
let updater = null;

/**
 * Main application routine
 */
const run = async () => {
    log.info('                              ');
    log.info('            &&&&&&&           ');
    log.info('                              ');
    log.info('       &&&&&&&&&&&&&&&&&      ');
    log.info('       &&&    &&&    &&&      ');
    log.info('        &&&&&&&&&&&&&&&       ');
    log.info('    &&&&&&&&&&&&&&&&&&&&&&&   ');
    log.info('     &&&&&&&&&&&&&&&&&&&&&    ');
    log.info('      &&&&&&&&&&&&&&&&&&&     ');
    log.info('       &&&&&&&&&&&&&&&&&      ');
    log.info('                              ');
    log.info('          Ship Agent          ');
    log.info('       By: Glenn de Haan      ');
    log.info('https://github.com/glenndehaan/ship');
    log.info('');

    const dockerInfo = await docker.info();
    log.info(`[DOCKER] Connected! ID: ${dockerInfo.ID}, Hostname: ${dockerInfo.Name}`);

    update();
    updater = setInterval(update, 10 * 1000);
}

/**
 * Update cycle
 */
const update = async () => {
    const nextUpdate = new Date().getTime() + (10 * 1000);
    log.info('');
    log.info(`[UPDATE] Started at: ${new Date()}`);

    const data = {};
    const dockerInfo = await docker.info();
    const containers = await docker.getContainers();

    log.info(`[UPDATE] Found ${containers.length} container(s)`);

    for(let item = 0; item < containers.length; item++) {
        const stats = await docker.getContainerResources(containers[item].Id);
        const processes = await docker.getContainerProcesses(containers[item].Id);

        data[containers[item].Id] = {};
        data[containers[item].Id].info = containers[item];
        data[containers[item].Id].stats = stats;
        data[containers[item].Id].processes = processes;
    }

    log.info('[UPDATE] Attempting to send data to Ship...');

    await fetch(`http://ship:3000/agent/${dockerInfo.ID}`, {
        method: 'post',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(() => {
        log.info(`[UPDATE] Data send to Ship!`);
    }).catch((e) => {
        log.error('[UPDATE] Unable to send data to ship! Error Message:')
        log.error(e);
    });

    log.info(`[UPDATE] Completed at: ${new Date()}`);
    log.info(`[UPDATE] Next update at: ${new Date(nextUpdate)}`);
    log.info('');
}

/**
 * Run the application
 */
run();

/**
 * Handle shutdown events
 */
shutdown(() => {
    clearInterval(updater);
    process.exit(0);
});
