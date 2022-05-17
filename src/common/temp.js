const { realpathSync } = require('fs');
const { tmpdir } = require('os');
const { basename, dirname, join } = require('path');
const shelljs = require('shelljs');
const { v4: uuid } = require('uuid');

let baseFolder;
let num = 1;

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
        shelljs.mkdir('-p', pathName);
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
    const base = module.exports.baseFolder;
    if(base) {
        return createFolder(join(base, `${num++}`));
    }
    throw new Error(`base folder not defined yet`);
};

/**
 * created new base directory within temp folder space
 * only if base not already set
 */
const initBase = () => {
    if(!module.exports.baseFolder) {
        const temp = realpathSync(tmpdir());
        const name = uuid();
        const newBase = createFolder(join(temp, name));
        module.exports.baseFolder = newBase;
    }
    return module.exports.baseFolder;
};

/**
 * removes base folder
 */
const destroy = () => {
    if(module.exports.baseFolder) {
        shelljs.rm('-rf', module.exports.baseFolder);
        delete module.exports.baseFolder;
    }
};

module.exports = {
    baseFolder
    , createTempFolder
    , destroy
    , initBase
};
