/**
 * Converts a date into time ago
 *
 * @param date
 * @return {string}
 */
module.exports = (date) => {
    let seconds = Math.floor((new Date().getTime() - date) / 1000);
    let interval = seconds / 31536000;

    if (interval > 1) {
        return `${Math.floor(interval)}y`;
    }

    interval = seconds / 2592000;
    if (interval > 1) {
        return `${Math.floor(interval)}m`;
    }

    interval = seconds / 86400;
    if (interval > 1) {
        return `${Math.floor(interval)}d`;
    }

    interval = seconds / 3600;
    if (interval > 1) {
        return `${Math.floor(interval)}h`;
    }

    interval = seconds / 60;
    if (interval > 1) {
        return `${Math.floor(interval)}m`;
    }

    return `${Math.floor(seconds)}s`;
}
