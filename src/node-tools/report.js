const MAX_WIDTH = 9;

/**
 * Reports the status of installed Node.js versions.
 *
 * @param {object} options
 * @param {import('../common/Version.js').default[]} options.installed -
 * Installed Node.js versions.
 * @param {object} [log=console] - Logger.
 * @returns {number} Exit code. Zero indicates no installation errors.
 */
const report = (
    { installed },
    log = console
) => {
    let exitCode = 0;

    for(const { version, error, isLink } of installed) {
        let msg = ` - ${version.padEnd(MAX_WIDTH, ' ')} - `;

        if(error) {
            msg += `Problem: ${error}`;
            exitCode = 1;
        }
        else {
            msg += isLink
                ? 'OK (link)'
                : 'OK ';
        }

        log.debug(msg);
    }

    log.debug('');

    return exitCode;
};

export default report;