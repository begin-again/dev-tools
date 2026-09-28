import { statSync, lstatSync, writeFile } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, resolve, parse, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Checks that folder exists and is in fact a folder
 *
 * @param {string} folder
 * @returns {boolean}
 */
const folderExists = (folder) => {
    try {
        return statSync(folder).isDirectory();
    }
    // eslint-disable-next-line no-unused-vars
    catch (e) {
        if(e) {
            return false;
        }
    }
};

/**
 * Checks that file exists and is in fact a file
 *
 * @param {string} file
 * @param {boolean} [isLink] true if symbolicLink
 * @returns {boolean}
 */
const fileExists = (file, isLink = false) => {
    try {
        return isLink ? lstatSync(file).isSymbolicLink() : statSync(file).isFile();
    }
    // eslint-disable-next-line no-unused-vars
    catch (e) {
        if(e) {
            return false;
        }
    }
};

/**
 * Convert base64 to utf8
 *
 * @param {string} encoded
 * @returns {string}
 */
const decodeBase64 = (encoded) => Buffer.from(encoded, 'base64').toString('utf-8');

/**
 * Write non-streaming content to file
 * - path must exist
 * - file will be created if does not exist
 *
 * @param {string|Buffer} content
 * @param {string} dest
 * @param {string} [encoding]
 * @param {boolean} [append]
 * @returns {Promise}
 */
const writeToFile = (content, dest, encoding = 'utf8', append = false) => {
    const flags = append ? 'a' : 'w';
    return new Promise((res, reject) => {
        writeFile(dest, content, { flags, encoding }, (err) => {
            if(err) {
                reject(`problem writing to ${dest}`);
            }
            res();
        });
    });
};

/**
 * Searches from specified path upwards for a file
 *  stops at root
 *
 * @param {string} fileName - name of file
 * @param {string} [startPath] - path to start from
 * @returns {string|null} null if not found
 */
const findFirstFile = (fileName, startPath = __dirname) => {

    if(!folderExists(startPath)) {
        return null;
    }

    const file = join(startPath, fileName);
    if(fileExists(file)) {
        return resolve(file);
    }
    try {
        // stop at root
        const { root, dir } = parse(file);
        if(root === dir) {
            return null;
        }
        return findFirstFile(fileName, join(startPath, '..'));
    }
    catch (e) {
        if(e) {
            return null;
        }
    }
};

/**
 *
 * @param {string} file  - file to read
 * @returns {Promise<object>} - content of file a JSON
 */
const fileAsJSON = async (file) => {
    if(fileExists(file)) {
        const data = await readFile(file, { encoding: 'utf8' });
        return JSON.parse(data);
    }
};

export {
    decodeBase64,
    fileAsJSON,
    fileExists,
    findFirstFile,
    folderExists,
    writeToFile
};
