/**
 * Check if we are using the dev version
 */
const dev = process.env.NODE_ENV !== 'production';

/**
 * Mock data
 *
 * @type {{agent: {example_node: {"00000000000000000": {stats: {precpu_stats: {system_cpu_usage: number, throttling_data: {throttled_time: number, periods: number, throttled_periods: number}, online_cpus: number, cpu_usage: {percpu_usage: number[], usage_in_kernelmode: number, total_usage: number, usage_in_usermode: number}}, cpu_stats: {system_cpu_usage: number, throttling_data: {throttled_time: number, periods: number, throttled_periods: number}, online_cpus: number, cpu_usage: {percpu_usage: number[], usage_in_kernelmode: number, total_usage: number, usage_in_usermode: number}}, memory_stats: {failcnt: number, stats: {inactive_anon: number, total_pgfault: number, total_unevictable: number, pgfault: number, mapped_file: number, total_pgpgout: number, total_active_anon: number, total_rss: number, rss: number, total_inactive_anon: number, active_file: number, total_mapped_file: number, total_inactive_file: number, total_rss_huge: number, cache: number, rss_huge: number, total_pgpgin: number, unevictable: number, active_anon: number, total_active_file: number, hierarchical_memory_limit: number, total_cache: number, pgpgin: number, pgmajfault: number, inactive_file: number, writeback: number, pgpgout: number, total_pgmajfault: number, total_writeback: number}, max_usage: number, usage: number, limit: number}, blkio_stats: {}}}}}}}
 */
const mockData = {
    agent: {
        example_node: {
            "00000000000000000": {
                info: {
                    Id: "85f6f97dd19b4e5895edfdb7fc0a5d008783cd6c162e0b24de15f5c8cd4dfad4",
                    Names: [
                        "/whaomi_whoami.3.yk5ou107d75fe6hi7w8w4xob9"
                    ],
                    Image: "containous/whoami:latest@sha256:7d6a3c8f91470a23ef380320609ee6e69ac68d20bc804f3a1c6065fb56cfa34e",
                    ImageID: "sha256:072fd1aacecbccbdea9862bbe1d655e7d089103cb1698b216f4bf06ccec31097",
                    Command: "/whoami",
                    Created: 1655208262,
                    Ports: [
                        {
                            PrivatePort: 80,
                            Type: "tcp"
                        }
                    ],
                    Labels: {
                        "com.docker.stack.namespace": "whaomi",
                        "com.docker.swarm.node.id": "5k0xw1l76tg0hp53gyqdjlxua",
                        "com.docker.swarm.service.id": "xf486jy6c4kkv6n5vo322nxbg",
                        "com.docker.swarm.service.name": "whaomi_whoami",
                        "com.docker.swarm.task": "",
                        "com.docker.swarm.task.id": "yk5ou107d75fe6hi7w8w4xob9",
                        "com.docker.swarm.task.name": "whaomi_whoami.3.yk5ou107d75fe6hi7w8w4xob9"
                    },
                    State: "running",
                    Status: "Up 45 hours",
                    HostConfig: {
                        NetworkMode: "default"
                    },
                    NetworkSettings: {
                        Networks: {
                            whaomi_default: {
                                IPAMConfig: {
                                    IPv4Address: "10.0.1.6"
                                },
                                Links: null,
                                Aliases: null,
                                NetworkID: "v35wmpwd0u1azy7bpz1g2av6r",
                                EndpointID: "97368404b0ef39c64a906ba9311d2d32854b2196305ca7a33aa7581ad4958017",
                                Gateway: "",
                                IPAddress: "10.0.1.6",
                                IPPrefixLen: 24,
                                IPv6Gateway: "",
                                GlobalIPv6Address: "",
                                GlobalIPv6PrefixLen: 0,
                                MacAddress: "02:42:0a:00:01:06",
                                DriverOpts: null
                            }
                        }
                    },
                    Mounts: []
                },
                stats: {
                    memory_stats: {
                        stats: {
                            total_pgmajfault: 0,
                            cache: 0,
                            mapped_file: 0,
                            total_inactive_file: 0,
                            pgpgout: 414,
                            rss: 6537216,
                            total_mapped_file: 0,
                            writeback: 0,
                            unevictable: 0,
                            pgpgin: 477,
                            total_unevictable: 0,
                            pgmajfault: 0,
                            total_rss: 6537216,
                            total_rss_huge: 6291456,
                            total_writeback: 0,
                            total_inactive_anon: 0,
                            rss_huge: 6291456,
                            hierarchical_memory_limit: 67108864,
                            total_pgfault: 964,
                            total_active_file: 0,
                            active_anon: 6537216,
                            total_active_anon: 6537216,
                            total_pgpgout: 414,
                            total_cache: 0,
                            inactive_anon: 0,
                            active_file: 0,
                            pgfault: 964,
                            inactive_file: 0,
                            total_pgpgin: 477
                        },
                        max_usage: 6651904,
                        usage: 6537216,
                        failcnt: 0,
                        limit: 67108864
                    },
                    blkio_stats: {},
                    cpu_stats: {
                        cpu_usage: {
                            percpu_usage: [
                                8646879,
                                24472255,
                                36438778,
                                30657443
                            ],
                            usage_in_usermode: 50000000,
                            total_usage: 100215355,
                            usage_in_kernelmode: 30000000
                        },
                        system_cpu_usage: 739306590000000,
                        online_cpus: 4,
                        throttling_data: {
                            periods: 0,
                            throttled_periods: 0,
                            throttled_time: 0
                        }
                    },
                    precpu_stats: {
                        cpu_usage: {
                            percpu_usage: [
                                8646879,
                                24350896,
                                36438778,
                                30657443
                            ],
                            usage_in_usermode: 50000000,
                            total_usage: 100093996,
                            usage_in_kernelmode: 30000000
                        },
                        system_cpu_usage: 9492140000000,
                        online_cpus: 4,
                        throttling_data: {
                            periods: 0,
                            throttled_periods: 0,
                            throttled_time: 0
                        }
                    }
                }
            }
        }
    }
};

/**
 * Houses the memory object
 *
 * @type {{}}
 */
const storage = {};

/**
 * Get data from the memory storage
 *
 * @param key
 * @return {*|null}
 */
const get = (key) => {
    if(dev) {
        return mockData[key];
    }

    return storage[key] || {};
}

/**
 * Store data into the memory storage
 *
 * @param key
 * @param id
 * @param data
 */
const set = (key, id, data) => {
    if(typeof storage[key] === 'undefined') {
        storage[key] = {};
    }

    storage[key][id] = data;
}

/**
 * Export the memory functions
 */
module.exports = {get, set};
