/**
 * Import vendor modules
 */
const drc = require('docker-registry-client');

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
            const client = drc.createClientV2({name: image});

            client.listTags((err, tags) => {
                if(err) {
                    console.error(err);
                    client.close();
                    resolve([]);
                    return;
                }

                if(tags.tags) {
                    resolve(tags.tags.sort((a, b) => b.localeCompare(a)));
                } else {
                    resolve([]);
                }

                client.close();
            });
        });
    }
};
