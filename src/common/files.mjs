import { statSync, lstatSync, writeFile, promises } from 'node:fs';
const { readFile } = promises;
import { join, resolve, parse } from 'node:path';

/**
 * Checks that folder exists and is in fact a folder
 *
 * @param {String} folder
 * @returns {Boolean}
 */
const folderExists = (folder) => {
    try {
        return statSync(folder).isDirectory();
    }
    catch (e) {
        if(e) {
            return false;
        }
    }
};

/**
 * Checks that file exists and is in fact a file
 *
 * @param {String} file
 * @param {Boolean} [isLink] true if symbolicLink
 * @returns {Boolean}
 */
const fileExists = (file, isLink = false) => {
    try {
        return isLink ? lstatSync(file).isSymbolicLink() : statSync(file).isFile();
    }

    catch (e) {
        if(e) {
            return false;
        }
    }
};

/**
 * Convert base64 to utf8
 *
 * @param {String} encoded
 * @returns {String}
 */
const decodeBase64 = (encoded) => Buffer.from(encoded, 'base64').toString('utf-8');

/**
 * Write non-streaming content to file
 * - path must exist
 * - file will be created if does not exist
 *
 * @param {String|Buffer} content
 * @param {String} dest
 * @param {String} [encoding]
 * @param {Boolean} [append]
 * @returns {Promise}
 */
const writeToFile = (content, dest, encoding = 'utf8', append = false) => {
    const flags = append ? 'a' : 'w';
    return new Promise((res, reject) => {
        writeFile(dest, content, { flags, encoding }, (err) => {
            if(err) {
                reject(new Error(`problem writing to ${dest}`));
            }
            res();
        });
    });
};

/**
 * Searches from specified path upwards for a file
 *  stops at root
 *
 * @param {String} fileName - name of file
 * @param {String} [startPath] - path to start from
 * @returns {String|null} null if not found
 */
const findFirstFile = (fileName, startPath = import.meta.dirname) => {

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

export { decodeBase64, fileAsJSON, fileExists, folderExists, writeToFile, findFirstFile };
