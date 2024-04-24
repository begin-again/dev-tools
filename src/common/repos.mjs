

import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import dotenv from 'dotenv';
import { fileExists, folderExists } from './files.mjs';
dotenv.config();

const { DEVROOT } = process.env;

/**
 * Obtains the package.json file from repo path
 *
 * @param {string} pkgFile file - path/package.json
 * @returns {object} JSON object
 */
const getPackage = (pkgFile) => {
    if(fileExists(pkgFile)) {
        const data = readFileSync(pkgFile).toString();
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
 * @param {array} foldersToInclude
 * @return {array<string>}  path strings
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


export {
    allRepoPaths,
    getPackage
};
