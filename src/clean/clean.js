
/**
 * @module Clean
 * removes temporary folders matching known patterns
 */
const { join } = require('path');
const { readdirSync, statSync, realpathSync } = require('fs');
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

module.exports = {
    removeTarget
    , folderList
};
