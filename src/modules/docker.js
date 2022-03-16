/**
 * Import vendor modules
 */
const Docker = require('dockerode');

/**
 * Check if we are using the dev version
 */
const dev = process.env.NODE_ENV !== 'production';

/**
 * Define hidden services
 */
const hiddenServices = typeof process.env.HIDDEN_SERVICES === "undefined" ? [] : process.env.HIDDEN_SERVICES.split(',');

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
const mock = dev;

/**
 * Mock data
 *
 * @type {{__tasks: [{Status: {State: string}, CreatedAt: number, Slot: number, ID: string}], ServiceStatus: {RunningTasks: number, DesiredTasks: number}, CreatedAt: number, Spec: {TaskTemplate: {ContainerSpec: {Image: string}}, Name: string}, UpdatedAt: number}}
 */
const mockData = {
    ID: '00000000000000000',
    CreatedAt: 0,
    UpdatedAt: 0,
    Spec: {
        Name: 'test_test',
        TaskTemplate: {
            ContainerSpec: {
                Image: 'alpine:latest'
            }
        },
        Mode: {
            Replicated: {
                Replicas: 1
            }
        }
    },
    ServiceStatus: {
        RunningTasks: 0,
        DesiredTasks: 0
    },
    Version: {
        Index: 5
    },
    UpdateStatus: {
        State: 'completed'
    },
    __tasks: [
        {
            ID: '00000000000000000',
            Slot: 1,
            CreatedAt: 0,
            UpdatedAt: 0,
            Status: {
                State: 'running',
                ContainerStatus: {
                    ContainerID: '00000000000000000'
                }
            },
            Spec: {
                ContainerSpec: {
                    Image: 'alpine:latest'
                }
            }
        }
    ]
}

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
            const allServices = await docker.listServices({status: true}).catch((e) => {
                console.error(e);
                process.exit(1);
            });

            const services = allServices.filter((service) => {
                return !hiddenServices.includes(service.Spec.Name);
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
            const services = await docker.listServices({filters: {name: [name]}, status: true}).catch((e) => {
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
     * Updates a service image version
     *
     * @param name
     * @param image
     * @param version
     * @returns {Promise<unknown>}
     */
    updateService: (name, image, version) => {
        return new Promise(async (resolve) => {
            const service = await dockerModule.getService(name);
            console.log('service', service);

            if(typeof service.Spec === "undefined") {
                resolve();
                return;
            }

            const opts = service.Spec;
            opts.version = parseInt(service.Version.Index);
            opts.TaskTemplate.ForceUpdate = 0;
            opts.TaskTemplate.ContainerSpec.Image = `${image}:${version}`;
            opts.Labels['com.docker.stack.image'] = `${image}:${version}`;

            console.log('OLD Opts', service.Spec);
            console.log('NEW Opts', opts);

            const result = await docker.getService(service.ID).update({}, opts);

            console.log('result', result);

            resolve();
        });
    },

    /**
     * Force update a service
     *
     * @param name
     * @returns {Promise<unknown>}
     */
    updateServiceForce: (name) => {
        return new Promise(async (resolve) => {
            const service = await dockerModule.getService(name);
            console.log('service', service);

            if(typeof service.Spec === "undefined") {
                resolve();
                return;
            }

            const opts = service.Spec;
            opts.version = parseInt(service.Version.Index);
            opts.TaskTemplate.ForceUpdate = typeof opts.TaskTemplate.ForceUpdate !== "number" ? 1 : opts.TaskTemplate.ForceUpdate + 1;

            console.log('OLD Opts', service.Spec);
            console.log('NEW Opts', opts);

            const result = await docker.getService(service.ID).update({}, opts);

            console.log('result', result);

            resolve();
        });
    },

    /**
     * Updates a service scale
     *
     * @param name
     * @param scale
     * @returns {Promise<unknown>}
     */
    updateServiceScale: (name, scale) => {
        return new Promise(async (resolve) => {
            const service = await dockerModule.getService(name);
            console.log('service', service);

            if(typeof service.Spec === "undefined") {
                resolve();
                return;
            }

            const opts = service.Spec;
            opts.version = parseInt(service.Version.Index);
            opts.TaskTemplate.ForceUpdate = 0;
            opts.Mode.Replicated.Replicas = parseInt(scale);

            console.log('OLD Opts', service.Spec);
            console.log('NEW Opts', opts);

            const result = await docker.getService(service.ID).update({}, opts);

            console.log('result', result);

            resolve();
        });
    },

    /**
     * Get the last logs from a service
     *
     * @param name
     * @param amount
     * @returns {*}
     */
    getServiceLogs: (name, amount = 250) => {
        return docker.getService(name).logs({
            details: true,
            stdout: true,
            stderr: true,
            tail: amount
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
    },

    /**
     * Get a docker task
     *
     * @param id
     * @returns {Promise<unknown>}
     */
    getTask: (id) => {
        return new Promise(async (resolve) => {
            const tasks = await docker.listTasks({filters: {id: [id]}}).catch((e) => {
                console.error(e);
                process.exit(1);
            });

            const task = tasks.find((task) => {
                return task.ID === id;
            });

            if(typeof task !== "undefined") {
                resolve(task);
            }

            resolve({});
        });
    },

    /**
     * Get the last logs from a task
     *
     * @param id
     * @param amount
     * @returns {*}
     */
    getTaskLogs: (id, amount = 250) => {
        return docker.getTask(id).logs({
            stdout: true,
            stderr: true,
            tail: amount
        });
    }
};

/**
 * Exports the docker module functions
 */
module.exports = dockerModule;
