/**
 * Import vendor modules
 */
const fetch = require('node-fetch');

/**
 * Define globals
 */
const DOCKER_DEFAULT_REGISTRY = 'registry-1.docker.io';
const DOCKER_DEFAULT_SERVICE = 'registry.docker.io';
const DOCKER_DEFAULT_AUTH = 'auth.docker.io';

/**
 * Exports the registry module functions
 */
module.exports = {
    /**
     * Get docker image tags from registry
     *
     * @param image
     * @returns {Promise<unknown>}
     */
    getImageTags: (image) => {
        return new Promise((resolve) => {
            const parsedImage = image.match(/^(?<Name>(?<=^)(?:(?<Domain>(?:(?:localhost|[\w-]+(?:\.[\w-]+)+)(?::\d+)?)|[\w]+:\d+)\/)?\/?(?<Namespace>(?:(?:[a-z0-9]+(?:(?:[._]|__|[-]*)[a-z0-9]+)*)\/)*)(?<Repo>[a-z0-9-_]+))[:@]?(?<Reference>(?<=:)(?<Tag>[\w][\w.-]{0,127})|(?<=@)(?<Digest>[A-Za-z][A-Za-z0-9]*(?:[-_+.][A-Za-z][A-Za-z0-9]*)*[:][0-9A-Fa-f]{32,}))?/);

            if(typeof parsedImage.groups.Domain === "undefined") {
                // Check if we need to force the library namespace on top level docker hub images
                if(parsedImage.groups.Namespace === '') {
                    parsedImage.groups.Namespace = 'library/';
                }

                // Use Default Docker Registry
                fetch(`https://${DOCKER_DEFAULT_AUTH}/token?service=${DOCKER_DEFAULT_SERVICE}&scope=repository:${parsedImage.groups.Namespace}${parsedImage.groups.Repo}:pull`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then((e) => {
                    return e.json();
                }).then((authBody) => {
                    if(authBody.token) {
                        fetch(`https://${DOCKER_DEFAULT_REGISTRY}/v2/${parsedImage.groups.Namespace}${parsedImage.groups.Repo}/tags/list`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${authBody.token}`
                            }
                        }).then((e) => {
                            return e.json();
                        }).then((body) => {
                            resolve(body.tags.sort((a, b) => b.localeCompare(a)));
                        }).catch((e) => {
                            console.error('[REGISTRY][DEFAULT] Error:');
                            console.error(e);
                            resolve([]);
                        });
                    } else {
                        console.error('[REGISTRY][DEFAULT] Error:');
                        console.error(new Error('Unable to get token'));
                        resolve([]);
                    }
                }).catch((e) => {
                    console.error('[REGISTRY][DEFAULT] Error:');
                    console.error(e);
                    resolve([]);
                });
            } else {
                // Use Provided Registry
                fetch(`https://${parsedImage.groups.Domain}/v2/${parsedImage.groups.Namespace}${parsedImage.groups.Repo}/tags/list`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then((e) => {
                    return e.json();
                }).then((body) => {
                    resolve(body.tags.sort((a, b) => b.localeCompare(a)));
                }).catch((e) => {
                    console.error('[REGISTRY][PROVIDED] Error:');
                    console.error(e);
                    resolve([]);
                });
            }
        });
    }
};
