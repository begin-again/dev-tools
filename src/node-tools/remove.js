
/**
 * remove.js
 * Removes node versions
*/

const fsPromises = require('fs').promises;
const semver = require('semver');
/**
 * compatibility check for rm & rmdir
 * @returns {Function}
 */
const rmCompatibility = () => {
    if(fsPromises.rm) {
        return fsPromises.rm;
    }
    return fsPromises.rmdir;
};
const remover = rmCompatibility();


/**
 * Removes node versions matching specified range
 *
 * @param {Object} param0
 * @param {array<Version>} param0.installed
 * @param {string} param0.version - version number or range
 * @param {boolean} param0.execute - true to remove files
 * @param {object} [log] logger
 * @returns {Promise<number>} exit code
 */
const remove = async ({ installed, version, execute }, log = console) => {
    const messagePrefix = execute ? 'Removed' : 'Would remove';
    const validRange = semver.validRange(version);
    let exitCode = 0;
    const versionsToRemove = installed.filter(v => semver.satisfies(v.version.slice(1), validRange));

    if(versionsToRemove.length > 0) {
        if(execute) {
            await Promise.all(
                versionsToRemove.map(async v => {
                    await remover(v.path, { recursive: true });
                    log.debug(`${messagePrefix} ${v.version} at ${v.path}`);
                })
            );
        }
        else {
            versionsToRemove.forEach(v => {
                log.debug(`${messagePrefix} ${v.version} at ${v.path}`);
            });
        }
    }
    else {
        log.debug(`No matches found for ${version} in range ${validRange}`);
        exitCode = 1;
    }

    return exitCode;
};

module.exports = remove;
