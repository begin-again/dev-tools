
/**
 * @module Clean
 * removes temporary folders matching known patterns
 */
const { join } = require('path');
const { realpathSync } = require('fs');
const { promises: fsPromises, constants } = require('fs');
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
    const folders = await fsPromises.readdir(rootFolder, { withFileTypes: true });
    return folders.reduce((acc, dirent) => {
        if(dirent.isDirectory() && regex.test(dirent.name)) {
            acc.push(join(rootFolder, dirent.name));
        }
        return acc;
    }, []);
};

/**
 * Deletes matching folders
 *
 * @param {string} name
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


/**
 *
 * @param {object} options
 * @param {string} options.root - over-ride sonarlint work folder path for testing
 * @param {number=} options.age
 * @param {object=} logger
 * @returns {Promise<number>} - number of folders removed
 */
const removeSonarTemp = async ({ root, age = 2 }, logger = console) => {
    const _root = root || realpathSync(join(process.env.HOME, '.sonarlint'));
    const now = Date.now();
    const DAY_MS = 86400000;
    let folders = [];
    try {
        await fsPromises.access(_root, constants.R_OK | constants.W_OK);

        folders = await fsPromises.readdir(_root, { withFileTypes: true });
        const targetFolders = folders.filter(d => d.isDirectory() && (d.name.startsWith('.sonarlinttmp_') || d.name.startsWith('xodus-local-only')));
        const foldersToDelete = targetFolders.filter(async d => {
            const { ctimeMs } = await fsPromises.stat(join(_root, d.name)).catch(() => ({ ctimeMs: 0 }));
            const daysOld = Math.floor((now - ctimeMs) / DAY_MS);
            return daysOld >= age;
        });

        logger.info(`Removing ${foldersToDelete.length} folders which are at least ${age} days ...`);
        const deleteFolders = await Promise.allSettled(
            foldersToDelete.map(d => remover(join(_root, d.name), { recursive: true })
                .then(() => `removed ${d.name}`)
            )
        );

        return deleteFolders.filter(f => f.status === 'fulfilled').length;
    }
    catch (err) {
        logger.error(`Error during sonar cleanup: ${err.message}`);
        return 0;
    }


};

module.exports = {
    removeTarget
    , folderList
    , removeSonarTemp
};
