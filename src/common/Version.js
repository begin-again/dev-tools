// @ts-check

import {
    accessSync,
    constants,
    lstatSync
} from 'node:fs';
import { join } from 'node:path';

/**
 * Represents an installed Node.js version.
 */
class Version {

    /**
     * @param {string} version
     * @param {string} path - Root directory of the Node.js installation
     * @param {object} [log]
     */
    constructor(version, path, log) {
        this._path = path;
        this._version = version;

        const binPath = process.platform === 'win32'
            ? join(this._path, 'node.exe')
            : join(this._path, 'bin', 'node');

        let logMsg = `engine/version: <${this._version}> `;

        try {
            accessSync(binPath, constants.X_OK);

            this._bin = binPath;
            this._link = lstatSync(this._bin).isSymbolicLink();

            logMsg += 'is OK';
        }
        catch(error) {
            logMsg += 'is rejected';

            if(error.code === 'ENOENT') {
                this._error =
                    `unable to find executable for version ` +
                    `${this._version} in ${this._path}`;
            }
            else {
                this._error =
                    `${error.code} : ${error.message}`.trim();
            }
        }

        if(log) {
            log.debug(logMsg);
        }
    }

    get error() {
        return this._error;
    }

    get path() {
        return this._path;
    }

    get version() {
        return this._version;
    }

    get bin() {
        return this._bin;
    }

    get isLink() {
        return this._link;
    }
}

export default Version;