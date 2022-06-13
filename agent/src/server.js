/**
 * Import own modules
 */
const log = require('./modules/logger');
const docker = require('./modules/docker');

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

    const containers = await docker.getContainers();
    console.log('containers', containers);

    containers.forEach(async (container) => {
        const stats = await docker.getContainerResources(container.Id);
        console.log('stats', stats);
    });
}

/**
 * Run the application
 */
run();

/**
 * Handle SIGTERM for docker
 */
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received');
    process.exit(0);
});
