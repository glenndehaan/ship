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
 * Docker module functions
 */
const dockerModule = {
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
     * Get all docker containers
     *
     * @returns {Promise<unknown>}
     */
    getContainers: () => {
        return new Promise(async (resolve) => {
            const containers = await docker.listContainers({status: ["running"]}).catch((e) => {
                console.error(e);
                process.exit(1);
            });

            resolve(containers);
        });
    },

    /**
     * Get container resource statistics
     *
     * @param id
     * @return {Promise<unknown>}
     */
    getContainerResources: (id) => {
        return new Promise(async (resolve) => {
            const resources = await docker.getContainer(id).stats({stream: false}).catch((e) => {
                console.error(e);
            });

            resolve(resources || {});
        });
    },

    /**
     * Get active processes from a container
     *
     * @param id
     * @return {Promise<unknown>}
     */
    getContainerProcesses: (id) => {
        return new Promise(async (resolve) => {
            const processes = await docker.getContainer(id).top().catch((e) => {
                console.error(e);
            });

            resolve(processes || {});
        });
    }
};

/**
 * Exports the docker module functions
 */
module.exports = dockerModule;
