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
 * Do we use mock data
 *
 * @type {boolean}
 */
const mock = false;

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
        if(mock) {
            return new Promise((resolve) => {
                resolve([]);
            });
        }

        return new Promise(async (resolve) => {
            const services = await docker.listServices({status: true}).catch((e) => {
                console.error(e);
                process.exit(1);
            });

            services.map(async (service) => {
                return {
                    ...service,
                    __tasks: await docker.listTasks({filters: {service: service.Spec.Name}}).catch((e) => {
                        console.error(e);
                        process.exit(1);
                    })
                }
            });

            resolve(services);
        });
    },

    /**
     * Get all docker tasks
     *
     * @returns {*}
     */
    getTasks: () => {
        if(mock) {
            return new Promise((resolve) => {
                resolve([]);
            });
        }

        return docker.listTasks({}).catch((e) => {
            console.error(e);
            process.exit(1);
        });
    }
};
