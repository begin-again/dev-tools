// @ts-check

/**
 * remove.js
 * Removes installed Node.js versions.
 */

import { rm } from 'node:fs/promises';

import semver from 'semver';

/**
 * Removes Node.js versions matching the specified range.
 *
 * @param {object} options
 * @param {import('../common/Version.js').default[]} options.installed
 * @param {string} options.version - Version number or semver range
 * @param {boolean} options.execute - True to remove files
 * @param {object} [log] logger
 * @returns {Promise<number>} exit code
 */
const remove = async (
    { installed, version, execute },
    log = console
) => {
    const messagePrefix = execute
        ? 'Removed'
        : 'Would remove';

    const validRange = semver.validRange(version);

    if(!validRange) {
        log.debug(`Invalid version range: ${version}`);

        return 1;
    }

    const versionsToRemove = installed.filter(
        installedVersion =>
            semver.satisfies(installedVersion.version, validRange)
    );

    if(!versionsToRemove.length) {
        log.debug(
            `No matches found for ${version} in range ${validRange}`
        );

        return 1;
    }

    for(const installedVersion of versionsToRemove) {
        if(execute) {
            await rm(installedVersion.path, {
                recursive: true,
                force: true
            });
        }

        log.debug(
            `${messagePrefix} ${installedVersion.version} ` +
            `at ${installedVersion.path}`
        );
    }

    return 0;
};

export default remove;