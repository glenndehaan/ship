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
 * Initialize a database for logging purposes
 */
const db = new JsonDB(new Config(dev ? `${__dirname}/../ship` : `/data/ship`, true, false, '/'));

/**
 * Check if the database base structure exists
 */
if(!db.exists('/logs')) {
    log.info('[DB] Initialized for the first time!');
    db.push('/logs', []);
} else {
    log.info('[DB] Ready!');
}

/**
 * Exports the database
 */
module.exports = db;
