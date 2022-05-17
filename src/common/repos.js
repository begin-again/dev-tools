/* eslint-disable camelcase */

const { readFileSync, readdirSync } = require('fs');
const { basename, join } = require('path');
const { fileExists, folderExists } = require('./files');
require('dotenv').config();

// eslint-disable-next-line no-process-env
const { DEVROOT } = process.env;

/**
 * Obtains the package.json file from repo path
 *
 * @param {String} pkgFile file - path/package.json
 * @returns {Object} JSON object
 */
const getPackage = (pkgFile) => {
    if(fileExists(pkgFile)) {
        const data = readFileSync(pkgFile, { encoding: 'utf8' });
        return JSON.parse(data);
    }
    return { error: true };
};

/**
 * Determine if a folder contains a .git folder
 *  - does not check that git can process the repo so we can still get false positives
 * @param  {String}  path
 * @return {Boolean}
 */
const isGitRepo = (path) => (basename(path) === '.git') && folderExists(path);

/**
 * Obtains paths of all git repositories
 *  - only search down one folder
 * @param {String} folder
 * @param {Array} foldersToInclude
 * @return {Array<string>}  path strings
 */
const allRepoPaths = (folder = DEVROOT, foldersToInclude = []) => {
    // get files in root
    return readdirSync(folder)
        .filter(name => {
            if(foldersToInclude.length) {
                return foldersToInclude.includes(name);
            }
            return true;
        })
        .map(name => join(folder, name))
        .filter(folderExists)
        .filter(path => {
            // returns array of path that end a folder named .git
            const result = readdirSync(path)
                .reduce((accumulator, current) => {
                    const subFolder = join(path, current);
                    // this is not fool-proof ideally we want to skip bogus repos
                    if(isGitRepo(subFolder)) {
                        accumulator.push(subFolder);
                    }
                    return accumulator;
                }, [])[0];
            return result !== undefined;
        });
};

/**
 * Obtains deployment root
 *
 * @param {String} folder - repository root folder
 * @returns {String}
 */
const deployRoot = (folder) => {
    let root = '';
    const paths = [
        `build-config.js`
        , join('builder', 'config.js')
    ];
    const files = paths.filter(file => fileExists(join(folder, file)));
    if(files.length) {
        const { path } = require(join(folder, files[0]));
        root = path && path.deployRoot || '';
    }
    return root;
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
        return {};
    }
};

module.exports = {
    allRepoPaths
    , deployRoot
    , getBinaryPaths
    , getPackage
};
