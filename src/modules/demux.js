/**
 * Demuxes Docker logs
 *
 * @param logs
 * @return {[]}
 */
module.exports = (logs) => {
    const returnLogs = [];

    for(let i = 0; i < logs.length; i) {
        const header = logs.slice(i, i + 8);
        const size = header.readUInt32BE(4);

        i += 8;

        returnLogs.push(logs.slice(i, i + size).toString());

        i += size;
    }

    return returnLogs;
};
