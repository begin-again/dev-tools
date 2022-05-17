
const yargs = require('yargs');
const { constants, accessSync, lstatSync } = require('fs');

const cmdKeys = {
    'folder-names': {
        alias: 'n'
        , describe: 'space separated names of repository folders.'
        , type: 'string'
        , array: true
    }
    , 'root': {
        alias: 'r'
        , describe: 'over ride the value in $DEVROOT'
        , type: 'string'
        // eslint-disable-next-line no-process-env
        , default: process.env.DEVROOT
    }
    , 'fetch': {
        alias: 'f'
        , describe: 'check origin for new commits'
        , type: 'boolean'
        , default: false
    }
    , 'silent' :{
        alias: [ 's', 'q' ]
        , describe: 'show only results'
        , type: 'boolean'
        , default: false
    }
};

/**
 * Aborts build if dev root path does not exist
 *
 * @param {String} root
 * @returns {Boolean}
 * @throws if path not accessible
 * @private
 */
const validatePath = ({ root }) => {
    try {
        accessSync(root, constants.R_OK);
        return lstatSync(root).isDirectory();
    }
    // eslint-disable-next-line no-unused-vars
    catch (e) {
        throw new Error(`Unable to access specified dev root folder of '${root}`);
    }
};

/**
 * Aborts if folderNames is used with deploy
 *
 * @param {Array} folderNames
 * @param {Boolean} deploy
 * @returns {Boolean}
 * @throws if both switches are used
 */
const validateNoConflict = ({ folderNames, deploy }) => {
    const folderNamesSpecifiedLength = folderNames ?
        folderNames.length :
        0;
    if(deploy && folderNamesSpecifiedLength > 0) {
        throw new Error(`--deploy conflicts with --folder-names`);
    }
    return true;

};

const options = {};

const setOptions = (test) => {
    const argv = test || yargs
        .options(cmdKeys)
        .help(true)
        .version(false)
        .strict(true)
        .check((argv) => {
            if(argv.root) {
                return validatePath(argv);
            }
            return true;
        })
        .check(validateNoConflict)
        .argv;

    module.exports.options.root = argv.root;
    module.exports.options.folderNames = argv.folderNames || [];
    module.exports.options.fetch = argv.fetch;
    module.exports.options.silent = argv.silent;
    module.exports.options.deploy = argv.deploy;
};

module.exports = {
    options
    , setOptions
};
