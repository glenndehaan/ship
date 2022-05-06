/**
 * Import vendor modules
 */
const fetch = require('node-fetch');

/**
 * Sends a payload to a webhook
 *
 * @param webhook
 * @param payload
 */
module.exports = (webhook, payload) => {
    fetch(webhook, {
        method: 'POST',
        body: JSON.stringify(payload)
    }).catch(() => {});
}
