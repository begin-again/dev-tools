
/**
 * @module Clean
 * removes temporary folders matching known patterns
 */
const { join } = require('path');
const { realpathSync, statSync } = require('fs');
const fsPromises = require('fs').promises;
const { readdir } = fsPromises;
const { tmpdir } = require('os');
const logger = console;

const defaultTempPath = realpathSync(tmpdir());
/**
 * compatibility check for rm & rmdir
 * @returns {Function}
 */
const rmCompatibility = () => {
    if(fsPromises.rm) {
        return fsPromises.rm;
    }
    return fsPromises.rmdir;
};
const remover = rmCompatibility();

/**
 * obtain matching folders
 *
 * @param {RegExp} regex
 * @param {String} rootFolder
 * @returns {Promise<string[]>} - folder names with path
 * @public
 */
const folderList = async (regex, rootFolder) => {
    const folders = await readdir(rootFolder, { withFileTypes: true });
    return folders
        .filter(dirent => dirent.isDirectory() && regex.test(dirent.name))
        .map(d => join(rootFolder, d.name));
};

/**
 * Deletes matching folders
 *
 * @param {RegExp} regex
 * @param {string} root
 * @returns {Promise}
 * @private
 */
const removeTarget = async (name, regex, root = defaultTempPath) => {
    logger.info(`${name} cleanup started on ${root}`);
    const folders = await folderList(regex, root);
    if(folders.length === 0) {
        logger.warn(`no suitable folders found`);
    }
    else {
        logger.warn(`attempting to delete ${folders.length} folders - please be patient`);
        const promises = folders.map(folder => {
            return remover(join(root, folder), { recursive: true })
                .catch((out) => {
                    logger.debug(`ERROR: ${folder} => ${out}`);
                    return 'skipped';
                });
        });
        return Promise.all(promises)
            .catch(err => {
                logger.debug(`problem encountered during delete ${err}`);
            })
            .then(() => {
                logger.info(`${name} cleanup completed`);
            });
    }
};



const DAY_MS = 86400000;

/**
 *
 * @param {object} options
 * @param {string} options.root - over-ride sonarlint work folder path for testing
 * @param {number} options.age
 * @param {Function} logger
 * @param {Promise<number>}
 */
const removeSonarTemp = async ({ root, age }, logger = console) => {
    const _root = root || join(process.env.HOME, '.sonarlint', 'work');
    const now = Date.now();
    const folders = await readdir(_root, { withFileTypes: true })
        .then(dirs =>
            dirs
                .filter(d => d.isDirectory())
                .filter(d => {
                    const { ctimeMs } = statSync(join(_root, d.name));
                    const daysOld = Math.floor((now - ctimeMs) / DAY_MS);
                    return daysOld >= age;
                })
        );
    logger.debug(`removing ${folders.length} folders`);

    return Promise.allSettled(
        folders.map(async d => {
            await remover(join(_root, d.name), { recursive: true }).then(() => `removed ${d.name}`);
        })
    ).then(r => {
        return r.filter(f => f.status === 'fulfilled').length;
    });
};

module.exports = {
    removeTarget
    , folderList
    , removeSonarTemp
};
