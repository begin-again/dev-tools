
/**
 * remove.js
 * Removes node versions
*/

const { rmSync } = require('fs');
const del = require('del');
const semver = require('semver');

// eslint-disable-next-line no-unused-vars
const { Version, versionKeys } = require('../common/engine');

/**
 * Removes node versions matching specified range
 *
 * @param {Object} param0
 * @param {Array<Version>} param0.installed
 * @param {String} param0.version - version number or range
 * @param {Boolean} param0.execute - true to remove files
 * @param {Object} [log] logger
 * @returns {Number} exit code
 */
const remove = async ({ installed, version, execute }, log = console) => {
    const messagePrefix = execute ? 'Removed' : 'Would remove';
    const validRange = semver.validRange(version);
    let matchesFound = 0;
    let exitCode = 0;
    installed.forEach(v => {
        if(semver.satisfies(v.version.slice(1), validRange)) {
            matchesFound++;
            if(execute) {
                if(rmSync) {
                    rmSync(v.path, { recursive: true });
                }
                else {
                    del.sync(v.path, { force: true });
                }
            }
            log.debug(`${messagePrefix} ${v.version} at ${v.path}`);
        }
    });
    if(matchesFound === 0) {
        log.debug(`No matches found for ${version} in range ${validRange}`);
        exitCode = 1;
    }
    return exitCode;
};

module.exports = remove;
