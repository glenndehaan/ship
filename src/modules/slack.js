/**
 * Import vendor modules
 */
const fetch = require('node-fetch');

/**
 * Define global variables
 */
const slack_webhook = process.env.SLACK_WEBHOOK || false;

/**
 * Sends a slack message to a webhook
 *
 * @param payload
 */
module.exports = (payload) => {
    fetch(slack_webhook, {
        method: 'POST',
        body: JSON.stringify(payload)
    }).catch(() => {});
}
