/**
 * remove-links.js
 * scans node versions locating node.exe files which are symbolic links and removes them
 *  will print removed links to stdout
*/

const { basename } = require('path');
const { unlinkSync } = require('fs');

const maxWidth = 9;

/**
 * Remove node.exe symbolic links
 *
 * @param {Object} param0
 * @param {Array<Version>} param0.installed
 * @param {Boolean} param0.dryRun
 * @param {Object} [log] logger
 */
const clean = ({ installed, dryRun }, log = console) => {
    let exitCode = 0;

    installed
        .filter(({ isLink }) => isLink)
        .map(({ version, bin }) => {
            const linkName = basename(bin);
            let msg = ` - ${version.padEnd(maxWidth, ' ')} - `;
            if(dryRun) {
                msg += `will delete ${linkName}`;
                log.debug(msg);
            }
            else {
                try {
                    unlinkSync(bin);
                    msg += `deleted symbolic link ${bin}`;
                    log.debug(msg);
                }
                // eslint-disable-next-line no-unused-vars
                catch (e) {
                    msg += `Unable to delete ${bin}, due to ${e.message}`;
                    log.error(msg);
                    exitCode = 1;
                }
            }
        });
    return exitCode;
};

module.exports = clean;
