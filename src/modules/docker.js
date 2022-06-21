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
 * Node Mock data
 *
 * @type {{}}
 */
const nodeMockData = {

}

/**
 * Service Mock data
 *
 * @type {{__tasks: [{Status: {ContainerStatus: {ContainerID: string}, State: string}, CreatedAt: number, Slot: number, ID: string, Spec: {ContainerSpec: {Image: string}}, UpdatedAt: number}], UpdateStatus: {State: string}, Version: {Index: number}, ServiceStatus: {RunningTasks: number, DesiredTasks: number}, CreatedAt: number, ID: string, Spec: {TaskTemplate: {ContainerSpec: {Env: [string], Image: string}}, Mode: {Replicated: {Replicas: number}}, Labels: {"com.docker.stack.image": string, "com.docker.stack.namespace": string, "traefik.http.routers.example-website-2022-staging.rule": string}, Name: string}, UpdatedAt: number}}
 */
const serviceMockData = {
    ID: '00000000000000000',
    CreatedAt: 0,
    UpdatedAt: 0,
    Spec: {
        Name: 'example-website-2022_example-website-2022-staging',
        TaskTemplate: {
            ContainerSpec: {
                Env: [
                    'TEST123=1'
                ],
                Image: 'example_website_2022:v0.1.2.2370295269'
            },
            Resources: {
                Limits: {
                    MemoryBytes: 367001600,
                    NanoCPUs: 1000000000
                },
                Reservations: {
                    MemoryBytes: 104857600,
                    NanoCPUs: 100000000
                }
            }
        },
        Mode: {
            Replicated: {
                Replicas: 1
            }
        },
        Labels: {
            "com.docker.stack.image": "example_website_2022:v0.1.2.2370295269",
            "com.docker.stack.namespace": "example-website-2022",
            "traefik.http.routers.example-website-2022-staging.rule": "Host(`example-website-2022.staging.example.com`)"
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
                    Image: 'example_website_2022:v0.1.2.2370295269'
                },
                Resources: {
                    Limits: {
                        MemoryBytes: 367001600,
                        NanoCPUs: 1000000000
                    },
                    Reservations: {
                        MemoryBytes: 104857600,
                        NanoCPUs: 100000000
                    }
                }
            },
            Version: {
                Index: 5
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
     * Get all docker nodes
     *
     * @return {Promise<unknown>}
     */
    getNodes: () => {
        if(mock) {
            return new Promise((resolve) => {
                resolve([nodeMockData]);
            });
        }

        return new Promise(async (resolve) => {
            resolve(await docker.listNodes({}).catch((e) => {
                console.error(e);
                process.exit(1);
            }));
        });
    },

    /**
     * Get all docker services
     *
     * @param search
     * @returns {Promise<unknown>}
     */
    getServices: (search = '') => {
        if(mock) {
            return new Promise((resolve) => {
                resolve([serviceMockData].filter((item) => {
                    return item.Spec.Name.includes(search);
                }).sort((a, b) => a.Spec.Name.localeCompare(b.Spec.Name)));
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

            resolve(services.filter((item) => {
                return item.Spec.Name.includes(search);
            }).sort((a, b) => a.Spec.Name.localeCompare(b.Spec.Name)));
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
                resolve(serviceMockData);
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
            opts.Mode.Replicated.Replicas = parseInt(scale);

            console.log('OLD Opts', service.Spec);
            console.log('NEW Opts', opts);

            const result = await docker.getService(service.ID).update({}, opts);

            console.log('result', result);

            resolve();
        });
    },

    /**
     * Restore a service
     *
     * @param name
     * @returns {Promise<unknown>}
     */
    restoreService: (name) => {
        return new Promise(async (resolve) => {
            const service = await dockerModule.getService(name);
            console.log('service', service);

            if(typeof service.Spec === "undefined") {
                resolve();
                return;
            }

            const opts = service.Spec;
            opts.version = parseInt(service.Version.Index);
            opts.rollback = 'previous';

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
     * @param details
     * @param timestamps
     * @param amount
     * @returns {*}
     */
    getServiceLogs: (name, details = false, timestamps = false, amount = 250) => {
        if(mock) {
            return new Promise((resolve) => {
                resolve([]);
            });
        }

        return docker.getService(name).logs({
            stdout: true,
            stderr: true,
            details: details,
            timestamps: timestamps,
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
                resolve([serviceMockData.__tasks[0]]);
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
        if(mock) {
            return new Promise((resolve) => {
                resolve(serviceMockData.__tasks[0]);
            });
        }

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
     * @param details
     * @param timestamps
     * @returns {*}
     */
    getTaskLogs: (id, details = false, timestamps = false, amount = 250) => {
        if(mock) {
            return new Promise((resolve) => {
                resolve([]);
            });
        }

        return docker.getTask(id).logs({
            stdout: true,
            stderr: true,
            details: details,
            timestamps: timestamps,
            tail: amount
        });
    }
};

/**
 * Exports the docker module functions
 */
module.exports = dockerModule;
