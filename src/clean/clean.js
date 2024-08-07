
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
 * Remove old temporary folders created by SonarLint
 *
 * @param {object} options
 * @param {string} options.root - over-ride sonarlint work folder path for testing
 * @param {object=} logger
 * @returns {Promise<number>} - number of folders removed
 */
const removeSonarTemp = async ({ root }, logger = console) => {
    const _root = root || realpathSync(join(process.env.HOME, '.sonarlint'));
    try {
        await fsPromises.access(_root, constants.R_OK | constants.W_OK);

        const folders = await fsPromises.readdir(_root, { withFileTypes: true });

        const targetFolders = folders.filter(d =>
            d.isDirectory() &&
            (d.name.startsWith('.sonarlinttmp_') || d.name.startsWith('xodus-local-only')))
        ;

        const deleteFolders = await Promise.allSettled(
            targetFolders
                .map(d => remover(join(_root, d.name), { recursive: true })
                    .then(() => `removed ${d.name}`)
                )
        );

        const busyFoldersCount = deleteFolders.filter(f => f.status === 'rejected').length;
        const deletedFoldersCount = deleteFolders.filter(f => f.status === 'fulfilled').length;

        if(busyFoldersCount > 0 && deletedFoldersCount === 0) {
            logger.info(`All folders are still in use and could not be deleted`);
        }
        else if(busyFoldersCount > 0 && deletedFoldersCount > 0) {
            logger.info(`Removed ${deletedFoldersCount} folders, ${busyFoldersCount} folders are still in use`);
        }
        else if(busyFoldersCount === 0 && deletedFoldersCount > 0) {
            logger.info(`Removed ${deletedFoldersCount} folders`);
        }
        else {
            logger.info(`No folders to remove`);
        }

        return deletedFoldersCount;
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
