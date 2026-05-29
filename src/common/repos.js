/* eslint-disable camelcase */

const { readFile, readdir } = require('node:fs/promises');
const { basename, join } = require('node:path');
const { fileExists, folderExists } = require('./files');
require('dotenv').config();

// eslint-disable-next-line no-process-env
const { DEVROOT } = process.env;

/**
 * Obtains the package.json file from repo path
 *
 * @param {string} pkgFile file - path/package.json
 * @returns {Promise<object>} JSON object
 */
const getPackage = async (pkgFile) => {
    if(fileExists(pkgFile)) {
        const data = (await readFile(pkgFile)).toString();
        return JSON.parse(data);
    }
    return { error: true };
};

/**
 * Determine if a folder contains a .git folder
 *  - does not check that git can process the repo so we can still get false positives
 * @param  {string}  path
 * @return {boolean}
 */
const isGitRepo = (path) => (basename(path) === '.git') && folderExists(path);

/**
 * Obtains paths of all git repositories
 *  - only search down one folder
 * @param {string} folder
 * @param {string[]} foldersToInclude - limit the folders to  return to those in this list. If empty, return all repos
 * @return {Promise<string[]>}  path strings
 */
const allRepoPaths = async (folder = DEVROOT, foldersToInclude = []) => {
    // get files in root

    const initialNames = await readdir(folder);
    const filtered = initialNames.reduce((acc, name) => {
        if(foldersToInclude.length && !foldersToInclude.includes(name)) {
            return acc;
        }
        const path = join(folder, name);
        if(folderExists(path)) {
            acc.push(path);
        }
        return acc;
    }, []);

    const result = [];
    for(const path of filtered) {
        const items = await readdir(path);
        const hasGitRepo = items.some(current => {
            const subFolder = join(path, current);
            return isGitRepo(subFolder);
        });
        if(hasGitRepo) {
            result.push(path);
        }
    }

    return result;
};


/**
 * Identify the location of the gulp binary
 *
 * @param {String} builderName - from package.builder
 * @param {String} repoPath - path of the repository which release is being run on
 * @param {String} [devRoot] - development root folder
 * @returns {Object} build root and the path to the gulp binary
 * @private
 */
const getBinaryPaths = (builderName, repoPath, devRoot = DEVROOT) => {
    const gulpBinary = `node_modules/gulp/bin/gulp.js`;
    try {
        const buildRoot = builderName ? join(devRoot, 'tooling', 'builders', builderName) : repoPath;
        const gulpFile = join(buildRoot, gulpBinary);
        return { buildRoot, gulpFile };
    }
    // eslint-disable-next-line no-unused-vars
    catch (e) {
        if(e) {
            return {};
        }
    }
};

module.exports = {
    allRepoPaths
    , getBinaryPaths
    , getPackage
};
