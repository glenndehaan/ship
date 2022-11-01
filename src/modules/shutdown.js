/**
 * Node.JS shutdown function
 *
 * @param callback
 */
module.exports = (callback) => {
    const signals = {
        'SIGHUP': 1,
        'SIGINT': 2,
        'SIGTERM': 15
    };

    Object.keys(signals).forEach((signal) => {
        process.on(signal, () => {
            console.log(`Process received a ${signal} signal`);
            callback();
        });
    });
};
