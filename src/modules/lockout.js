/**
 * Define global variables
 */
const use_kubernetes = process.env.KUBERNETES || false;
const lockout_exceptions = process.env.LOCKOUT_EXCEPTIONS || '';
const lockout_service_regex = use_kubernetes ? (process.env.LOCKOUT_DEPLOYMENT_REGEX || '') : (process.env.LOCKOUT_SERVICE_REGEX || '');
const lockout_days = process.env.LOCKOUT_DAYS || '';
const lockout_after_hour = process.env.LOCKOUT_AFTER_HOUR || false;

/**
 * Checks if we can perform an action during a specific day or hour
 *
 * @param username
 * @param service
 * @return {boolean}
 */
module.exports = (username, service) => {
    const lockoutDays = lockout_days.split(',');
    const usernameExceptions = lockout_exceptions.split(',');

    // Check if we have a user exception
    if(usernameExceptions.includes(username)) {
        return true;
    }

    // Check if we are on a lockout day
    if(lockout_days) {
        if (lockoutDays.includes(`${new Date().getDay()}`)) {
            const regex = new RegExp(lockout_service_regex);
            if(service.match(regex)) {
                return false;
            }
        }
    }

    // Check if we are on a lockout hour
    if(lockout_after_hour) {
        const lockoutAfterHour = parseInt(lockout_after_hour);
        if (new Date().getHours() >= lockoutAfterHour) {
            const regex = new RegExp(lockout_service_regex);
            if(service.match(regex)) {
                return false;
            }
        }
    }

    return true;
};
