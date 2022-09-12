/**
 * Import vendor modules
 */
const Kubernetes = require('kubernetes-client').Client;

/**
 * Define hidden services
 */
const hiddenServices = typeof process.env.HIDDEN_SERVICES === "undefined" ? [] : process.env.HIDDEN_SERVICES.split(',');

/**
 * Create kubernetes connection
 */
const kubernetes = new Kubernetes({
    version: '1.13'
});

/**
 * Kubernetes module functions
 */
const kubernetesModule = {
    /**
     * Return docker info
     *
     * @returns {Promise<*>}
     */
    info: () => {
        return new Promise(async (resolve) => {
            const nodes = await kubernetes.api.v1.nodes.get().catch((e) => {
                console.error(e);
                process.exit(1);
            });

            resolve(nodes.body);
        });
    },

    /**
     * Get all docker nodes
     *
     * @return {Promise<unknown>}
     */
    getNodes: () => {
        return new Promise(async (resolve) => {
            const nodes = await kubernetes.api.v1.nodes.get().catch((e) => {
                console.error(e);
                process.exit(1);
            });

            resolve(nodes.body.items.sort((a, b) => a.metadata.name.localeCompare(b.metadata.name)));
        });
    },

    /**
     * Get all docker services
     *
     * @param search
     * @param getAll
     * @returns {Promise<unknown>}
     */
    getServices: (search = '', getAll = false) => {
        return new Promise(async (resolve) => {
            const allServices = await docker.listServices({status: true}).catch((e) => {
                console.error(e);
                process.exit(1);
            });

            let services = allServices;

            if(!getAll) {
                services = allServices.filter((service) => {
                    return !hiddenServices.includes(service.Spec.Name);
                });
            }

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
     * @param details
     * @param timestamps
     * @returns {*}
     */
    getTaskLogs: (id, details = false, timestamps = false, amount = 250) => {
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
 * Exports the kubernetes module functions
 */
module.exports = kubernetesModule;
