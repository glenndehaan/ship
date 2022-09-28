/**
 * Import base packages
 */
const {JsonDB} = require('node-json-db');
const {Config} = require('node-json-db/dist/lib/JsonDBConfig');

/**
 * Import own modules
 */
const log = require('./logger');

/**
 * Check if we are using the dev version
 */
const dev = process.env.NODE_ENV !== 'production';

/**
 * Check if we are using the kubernetes version
 */
const use_kubernetes = process.env.KUBERNETES || false;

/**
 * Initialize a database for logging purposes
 */
const db = !use_kubernetes ? new JsonDB(new Config(dev ? `${__dirname}/../ship` : `/data/ship`, true, false, '/')) : {};

/**
 * Check if the database base structure exists
 */
if(!use_kubernetes) {
    if (!db.exists('/logs')) {
        log.info('[DB] Initialized for the first time!');
        db.push('/logs', []);
    } else {
        log.info('[DB] Ready!');
    }
} else {
    log.info('[DB] Using kubernetes etcd datastore!');
}

/**
 * Exports the database
 */
module.exports = db;
