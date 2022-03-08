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
 * Mock data
 *
 * @type {{__tasks: [{Status: {State: string}, CreatedAt: number, Slot: number, ID: string}], ServiceStatus: {RunningTasks: number, DesiredTasks: number}, CreatedAt: number, Spec: {TaskTemplate: {ContainerSpec: {Image: string}}, Name: string}, UpdatedAt: number}}
 */
const mockData = {
    CreatedAt: 0,
    UpdatedAt: 0,
    Spec: {
        Name: 'test_test',
        TaskTemplate: {
            ContainerSpec: {
                Image: 'example/example:latest'
            }
        }
    },
    ServiceStatus: {
        RunningTasks: 0,
        DesiredTasks: 0
    },
    __tasks: [
        {
            ID: '00000000000000000',
            Slot: 1,
            CreatedAt: 0,
            Status: {
                State: 'running'
            }
        }
    ]
}

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
                resolve([mockData]);
            });
        }

        return new Promise(async (resolve) => {
            const services = await docker.listServices({status: true}).catch((e) => {
                console.error(e);
                process.exit(1);
            });

            for(let item = 0; item < services.length; item++) {
                const service = services[item];

                services[item].__tasks = await docker.listTasks({filters: {service: [service.Spec.Name]}}).catch((e) => {
                    console.error(e);
                    process.exit(1);
                });
            }

            resolve(services);
        });
    },

    /**
     * Get a docker service
     *
     * @param name
     * @returns {Promise<unknown>}
     */
    getService: (name) => {
        if(mock) {
            return new Promise((resolve) => {
                resolve(mockData);
            });
        }

        return new Promise(async (resolve) => {
            const services = await docker.listServices({filters: {service: [name]}, status: true}).catch((e) => {
                console.error(e);
                process.exit(1);
            });

            const service = services.find((service) => {
                return service.Spec.Name === name;
            });

            if(typeof service !== "undefined") {
                service.__tasks = await docker.listTasks({filters: {service: [name]}}).catch((e) => {
                    console.error(e);
                    process.exit(1);
                });

                resolve(service);
            }

            resolve({});
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
