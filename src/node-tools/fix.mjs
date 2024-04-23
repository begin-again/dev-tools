import { copyFileSync, readdirSync, symlinkSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { type as osType } from 'node:os';
const targetName = osType === 'Windows_NT' ? 'node.exe' : 'node';

/**
 * Obtains the executable file found in path
 *
 * @param {String} path - to the node version folder
 */
const execFileFound = (path) => {
    const files = readdirSync(path)
        .filter(file => file.endsWith('.exe'))
        .sort((a, b) => b.localeCompare(a));
    return files[0];
};

/**
 * Attempts to correct unusable version installations
 *
 * @param {Object} param0
 * @param {Array<Version>} param0.installed - installed versions
 * @param {Boolean} param0.dryRun - show action only
 * @param {String} param0.mode - create symbolic link or copy
 * @param {Object} [log] logger
 */
const fix = ({ installed, execute, mode }, log = console) => {
    let exitCode = 0;
    const errors = installed
        .filter(({ error }) => error);

    if(errors.length) {
        errors.forEach(({ version, path }) => {
            const execFile = execFileFound(path);
            if(!execute) {
                if(mode === 'copy') {
                    log.debug(`${version}: will copy '${execFile}' to '${targetName}'`);
                }
                else if(mode === 'link') {
                    log.debug(`${version}: will create symbolic link from '${targetName}' to '${execFile}'`);
                }
            }
            else if(mode === 'link') {
                try {
                    const src = resolve(path, execFile);
                    const target = resolve(path, targetName);
                    symlinkSync(src, target);
                    log.debug(`${version}: created symbolic link from '${targetName}' to '${execFile}'`);
                }
                catch (e) {
                    log.error(`${version}: was unable to link ''${targetName}' to '${execFile}'. Error code is ${e.code}`);
                    exitCode = 1;
                }
            }
            else if(mode === 'copy') {
                try {
                    copyFileSync(join(path, execFile), join(path, targetName));
                    log.debug(`${version}: copied '${execFile}' to '${targetName}'`);
                }
                catch (e) {
                    log.error(`${version}: was unable to copy '${execFile}' to '${targetName}'. Error code is ${e.code}`);
                    exitCode = 1;
                }
            }
        });
    }
    else {
        log.debug('No Errors to fix');
    }
    return exitCode;
};


export default fix;
