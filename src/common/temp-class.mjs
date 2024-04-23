import { realpathSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { v4 as uuid } from 'uuid';

/**
 * @class Temp
 */
class Temp {

    /**
     * creates temp folder in system temp folder
     * @param {string} [baseFolderName] defaults to uuid v4
     */
    constructor(baseFolderName) {
        const temp = realpathSync(tmpdir());
        const name = baseFolderName || uuid();
        this._baseFolder = this._createFolder(join(temp, name));
        this._num = 0;
    }

    /**
     * root of th the temp folder within the system
     * temp.
     *
     * @readonly
     * @memberof Temp
     */
    get baseFolder() {
        return this._baseFolder;
    }

    /**
    * removes base folder
    */
    destroy () {
        if(this._baseFolder) {
            rmSync(this._baseFolder, { recursive: true });
            this._baseFolder = '';
        }
    };

    /**
    * Create a folder
    *
    * @param {String} pathName
    * @returns path to folder
    * @throws on error
    * @private
    */
    _createFolder (pathName) {
        try {
            mkdirSync(pathName, { recursive: true });
            return pathName;
        }
        catch (error) {
            throw new Error(`createFolder threw trying to create:\n ${this._shortPath(pathName)} \n ${error.message}`);
        }
    };

    /**
    * Creates temp folders inside of a common parent.
    *
    * @returns {String} full path to temp folder
    * @throws base folder not defined yet
    */
    add () {
        if(this._baseFolder) {
            const folderPath = join(this._baseFolder, `${this.num}`);
            this.num += 1;
            return this._createFolder(folderPath);
        }
        throw new Error(`base folder not defined`);
    };

    /**
    * Abbreviates the path
    *
    * @param {string} fullPath
    * @private
    */
    _shortPath(fullPath) {
        return fullPath ? `${basename(dirname(fullPath))}/${basename(fullPath)}` : `Empty`;
    }
}

export default Temp;
