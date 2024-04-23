import { realpathSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { v4 as uuid } from 'uuid';

let num = 1;
const state = {
    baseFolder: ''
};

/**
 * Abbreviates the path
 *
 * @param {} fullPath
 */
const shortPath = (fullPath) =>
    fullPath ? `${basename(dirname(fullPath))}/${basename(fullPath)}` : `Empty`;


/**
 * Create the new folder
 *
 * @param {String} pathName
 * @returns path to folder
 * @throws on error
 */
const createFolder = (pathName) => {
    try {
        mkdirSync(pathName, { recursive: true });
        return pathName;
    }
    catch (error) {
        throw new Error(`createFolder threw trying to create:\n ${shortPath(pathName)} \n ${error.message}`);
    }
};

/**
 * Creates temp folders inside of a common parent.
 *
 * @returns {String} full path to temp folder
 * @throws base folder not defined yet
 */
const createTempFolder = () => {
    const base = state.baseFolder;
    if(base) {
        const folderPath = join(base, `${num}`);
        num += 1;
        return createFolder(folderPath);
    }
    throw new Error(`base folder not defined yet`);
};

/**
 * created new base directory within temp folder space
 * only if base not already set
 */
const initBase = () => {
    if(!state.baseFolder) {
        const temp = realpathSync(tmpdir());
        const name = uuid();
        const newBase = createFolder(join(temp, name));
        state.baseFolder = newBase;
    }
    return state.baseFolder;
};

/**
 * removes base folder
 */
const destroy = () => {
    if(state.baseFolder) {
        rmSync(state.baseFolder, { recursive: true });
        state.baseFolder = '';
    }
};



export {
    state
    , createTempFolder
    , destroy
    , initBase
};
