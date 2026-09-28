import {
    copyFileSync,
    readdirSync,
    symlinkSync
} from 'node:fs';
import { join } from 'node:path';

const isWindows = process.platform === 'win32';

/**
 * Obtains a potential Node.js executable from an installation.
 *
 * On Windows, nvm installations may contain a versioned executable that
 * can be copied or linked to node.exe.
 *
 * @param {string} path - Node.js installation root.
 * @returns {string|undefined} Executable filename.
 */
const execFileFound = (path) => {
    if(!isWindows) {
        return undefined;
    }

    return readdirSync(path)
        .filter(file =>
            file.endsWith('.exe') &&
            file.toLowerCase() !== 'node.exe'
        )
        .toSorted((a, b) => b.localeCompare(a))[0];
};

/**
 * Attempts to correct unusable Node.js version installations.
 *
 * @param {object} options
 * @param {import('../common/Version.js').default[]} options.installed
 * @param {boolean} options.execute - Apply changes when true.
 * @param {'copy'|'link'} options.mode - Repair method.
 * @param {object} [log] - Logger.
 * @returns {number} Exit code.
 */
const fix = (
    { installed, execute, mode },
    log = console
) => {
    let exitCode = 0;

    const errors = installed.filter(({ error }) => error);

    if(!errors.length) {
        log.debug('No Errors to fix');

        return exitCode;
    }

    for(const { version, path } of errors) {
        const execFile = execFileFound(path);

        if(!execFile) {
            log.error(
                `${version}: unable to find an executable to repair`
            );

            exitCode = 1;

            continue;
        }

        const targetName = 'node.exe';

        if(!execute) {
            if(mode === 'copy') {
                log.debug(
                    `${version}: will copy '${execFile}' ` +
                    `to '${targetName}'`
                );
            }
            else if(mode === 'link') {
                log.debug(
                    `${version}: will create symbolic link from ` +
                    `'${targetName}' to '${execFile}'`
                );
            }

            continue;
        }

        const src = join(path, execFile);
        const target = join(path, targetName);

        try {
            if(mode === 'link') {
                symlinkSync(src, target);

                log.debug(
                    `${version}: created symbolic link from ` +
                    `'${targetName}' to '${execFile}'`
                );
            }
            else if(mode === 'copy') {
                copyFileSync(src, target);

                log.debug(
                    `${version}: copied '${execFile}' ` +
                    `to '${targetName}'`
                );
            }
        }
        catch(error) {
            log.error(
                `${version}: was unable to ${mode} ` +
                `'${execFile}' to '${targetName}'. ` +
                `Error code is ${error.code}`
            );

            exitCode = 1;
        }
    }

    return exitCode;
};

export default fix;