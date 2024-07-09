
/**
 * report.js
 * Locates node versions and reports the node binary files present, including symbolic links
*/

import { type as osType } from 'node:os';
const binName = osType === 'Windows_NT' ? 'node.exe' : 'node';
const { NVM_HOME } = process.env;

/**
 * Scans versions and reports status
 *
 * @param {Object} param0
 * @param {Array<Version>} param0.installed
 * @param {Object} [log] logger
 */
const report = ({ installed }, log = console) => {
    let errorCount = 0;

    installed.forEach(({ version, error, isLink }) => {
        const maxWidth = 9;
        let msg = ` - ${version.padEnd(maxWidth, ' ')} - `;
        if(error) {
            errorCount += 1;
            msg += `Problem: '${binName}' not found or executable`;
        }
        else {
            msg += `OK ${isLink ? '(link)' : ''}`;
        }
        log.debug(`${msg}`);
    });

    if(errorCount) {
        const checkPath = NVM_HOME ? 'll $NVM_HOME/<version>' : 'll $NVM_BIN/../../<version>';
        log.debug(`
    ${errorCount} errors
    take a look at running '${checkPath}' for each problem version
        might be as simple as running 'nt fix'.
    `);

    }

};

export default report;
