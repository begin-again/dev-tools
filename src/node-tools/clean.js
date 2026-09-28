/**
 * Removes symbolic links used as Node.js executables.
 *
 * @module clean
 */

import { unlinkSync } from 'node:fs';
import { basename } from 'node:path';

const MAX_WIDTH = 9;

/**
 * Removes Node.js executables that are symbolic links.
 *
 * When execute is false, reports the links that would be removed without
 * modifying the filesystem.
 *
 * @param {object} options - Clean options.
 * @param {import('../common/version.js').default[]} options.installed -
 * Installed Node.js versions.
 * @param {boolean} options.execute - Remove links when true.
 * @param {object} [log=console] - Logger.
 * @returns {number} Exit code. Zero indicates success.
 */
const clean = (
    { installed, execute },
    log = console
) => {
    let exitCode = 0;

    const links = installed.filter(({ isLink }) => isLink);

    for(const { version, bin } of links) {
        const linkName = basename(bin);

        let msg = ` - ${version.padEnd(MAX_WIDTH, ' ')} - `;

        if(!execute) {
            msg += `will delete ${linkName}`;
            log.debug(msg);

            continue;
        }

        try {
            unlinkSync(bin);

            msg += `deleted symbolic link ${bin}`;
            log.debug(msg);
        }
        catch(error) {
            msg +=
                `Unable to delete ${bin}, due to ${error.message}`;

            log.error(msg);
            exitCode = 1;
        }
    }

    return exitCode;
};

export default clean;