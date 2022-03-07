/**
 * Import vendor modules
 */
const Docker = require('dockerode');

/**
 * Create docker connection
 *
 * @type {Docker}
 */
const docker = new Docker({
    socketPath: '/var/run/docker.sock'
});

/**
 * Exports the docker module functions
 */
module.exports = {
    /**
     * Return docker info
     *
     * @returns {Promise<*>}
     */
    info: () => {
        return docker.info({}).catch((e) => {
            console.error(e);
            process.exit(1);
        });
    },

    /**
     * Get all docker services
     *
     * @returns {Promise<unknown>}
     */
    getServices: () => {
        return new Promise(async (resolve) => {
            const services = await docker.listServices({status: true}).catch((e) => {
                console.error(e);
                process.exit(1);
            });
            resolve(services);
        });
    }
};
