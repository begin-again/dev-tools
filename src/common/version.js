
import { accessSync, lstatSync, constants as FSC } from 'node:fs';
import { join } from 'node:path';

class Version {
    /**
     * @param {string} version - version name
     * @param {string} path - path to executables folder
     * @param {object} [log] - logger
     * @param {function} log.debug - logger
     * @param {object} [env] - environment variables
     */
    constructor(version, path, log, env) {
        const { NVM_HOME } = (env || process.env);
        this._path = path;
        this._version = version;

        const binName = NVM_HOME ? 'node.exe' : 'node';
        const binPath = join(this._path, binName);
        let logMsg = `engine/version: <${this._version}> `;
        try {
            // executable check doesn't work on windows
            accessSync(binPath, FSC.X_OK);
            this._bin = binPath;
            this._link = lstatSync(this._bin).isSymbolicLink();
            logMsg += `is OK`;
        }
        catch (e) {
            logMsg += `is rejected`;
            if(e.code === 'ENOENT') {
                this._error = `unable to find executable ${binName} for version ${this._version} in ${this._path}`;
            }
            else {
                this._error = `${e.code} : ${e.message}`.trim();
            }
        }
        if(log) {
            log.debug(logMsg);
        }
    }

    /**
    * @readonly
    * @memberof Version
    * @returns {string}
    */
    get error() {
        return this._error;
    }

    /**
    * @readonly
    * @memberof Version
    * @returns {string}
    */
    get path() {
        return this._path;
    }

    /**
    * @readonly
    * @memberof Version
    * @returns {string}
    */
    get version() {
        return this._version;
    }

    /**
    * @readonly
    * @memberof Version
    * @returns {string}
    */
    get bin() {
        return this._bin;
    }

    /**
    * @readonly
    * @memberof Version
    * @returns {boolean}
    */
    get isLink() {
        return this._link;
    }
}

export default Version;
