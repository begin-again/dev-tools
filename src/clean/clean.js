
/**
 * @module Clean
 * removes temporary folders matching known patterns
 */
const { join } = require('path');
const { readdirSync, statSync, realpathSync, rmdirSync } = require('fs');
const { tmpdir } = require('os');
const del = require('del');
const logger = console;

const defaultTempPath = realpathSync(tmpdir());


/**
 * obtain matching folders
 *
 * @param {RegExp} regex
 * @param {String} rootFolder
 * @returns {Array} String[] - folder names
 * @public
 */
const folderList = (regex, rootFolder) => {
    return readdirSync(rootFolder)
        .filter(folder => {
            const fullPath = join(rootFolder, folder);
            let stat;
            try {
                stat = statSync(fullPath);
            }
            // eslint-disable-next-line no-unused-vars
            catch (e) {
                return false;
            }
            return stat.isDirectory() && regex.test(folder);
        });
};

/**
 * Deletes matching folders
 *
 * @param {RegExp} regex
 * @param {String} root
 * @returns {Promise}
 * @private
 */
const removeTarget = (name, regex, root = defaultTempPath) => {
    logger.info(`${name} cleanup started on ${root}`);
    const folders = folderList(regex, root);
    if(folders.length === 0) {
        logger.warn(`no suitable folders found`);
        return Promise.resolve();
    }
    logger.warn(`attempting to delete ${folders.length} folders - please be patient`);
    return Promise.all(
        folders.map(folder => {
            return del(join(root, folder), { force: true })
                .then(() => {
                    return 'deleted';
                })
                .catch((out) => {
                    logger.debug(`ERROR: ${folder} => ${out}`);
                    return 'skipped';
                });
        })
    )
        .catch(err => {
            logger.debug(`problem encountered during delete ${err}`);
        })
        .then(() => {
            logger.info(`${name} cleanup completed`);
        });
};

const DAY_MS = 86400000;

/**
 *
 * @param {object} options
 * @param {string} options.root
 * @param {number} options.age
 * @param {Function} logger
 */
const removeSonarTemp = ({ root, age }, logger = console) => {
    const _root = root || join(process.env.HOME, '.sonarlint', 'work');
    const now = Date.now();
    const folders = readdirSync(_root, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .filter(d => {
            const daysOld = Math.floor((now - statSync(join(_root, d.name)).ctimeMs) / DAY_MS);
            return daysOld >= age;
        });
    logger.debug(`removing ${folders.length} folders`);
    folders.forEach(d => {
        rmdirSync(join(_root, d.name), { recursive: true });
    });
    return folders.length;
};

module.exports = {
    removeTarget
    , folderList
    , removeSonarTemp
};
