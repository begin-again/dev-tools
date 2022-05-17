const { accessSync, constants, lstatSync } = require('fs');
const yargs = require('yargs');
const moment = require('moment');
moment.suppressDeprecationWarnings = true;

const options = {
    dateOptions: 'YYYY-MM-DD hh:mm A'
    , allowedFormats: [ 'YYYY-MM-DD', 'M/D/YY', 'M/D/YY', 'L' ]
    , offset: 3
    , timePad: 11
};

const cmdKeys = {
    'folder-names': {
        alias: 'n'
        , describe: 'space separated names of repository folders'
        , type: 'string'
        , array: true
    }
    , 'from-date': {
        alias: 'f'
        , describe: 'Show refs later than and include this date, ISO formats'
        , type: 'string'
        , requiresArg: true
    }
    , 'to-date': {
        alias: 't'
        , describe: 'Show refs earlier than and including this date, ISO formats'
        , type: 'string'
        , requiresArg: true
    }
    , 'dev-root': {
        alias: 'r'
        , describe: 'root folder of development environment (/c/blah/blah). Default is DEVROOT'
        , type: 'string'
        // eslint-disable-next-line no-process-env
        , default: process.env.DEVROOT
    }
    , 'date': {
        alias: 'd'
        , describe: 'shortcut to specify a single date, ISO formats. Default is today'
        , type: 'string'
        , requiresArgs: true
    }
};

/**
 * Validates from and to dates,
 *
 * @param {String} checkDate
 * @throws if date is not valid
 * @private
 */
const validateDate = (checkDate, msg) => {
    try {
        const parsed = moment(checkDate, options.allowedFormats, true);
        if(!parsed.isValid()) {
            throw new Error('unkown format');
        }
        return true;
    }
    // eslint-disable-next-line no-unused-vars
    catch (e) {
        throw new Error(`${msg} not recognized as a date [${checkDate}]`);
    }
};

/**
 * Aborts build if dev root path does not exist
 *
 * @param {String} devRoott
 * @throws if path not accessible
 * @private
 */
const validatePath = ({ devRoot }) => {
    try {
        accessSync(devRoot, constants.R_OK);
        return lstatSync(devRoot).isDirectory();
    }
    // eslint-disable-next-line no-unused-vars
    catch (e) {
        throw new Error(`Unable to access specified dev root folder of '${devRoot}`);
    }
};

/**
 * Determines if a date is in the future
 * @param {String} checkDate
 * @returns {Boolean}
 * @throws if checkDate is not valid date
 * @private
 */
const isFuture = (checkDate) => {
    const _date = moment(checkDate, options.allowedFormats, true);
    const endOfToday = moment().endOf('day');
    return _date > endOfToday;
};

/**
 * Parse command line and configures options
 *
 * @param {Boolean} test - used for testing only
 */
const setOptions = (test) => {
    const argv = test || yargs
        .options(cmdKeys)
        .version(false)
        .help(true)
        .check((_argv) => {
            // super secret shortcut
            if(!_argv.date && !_argv.fromDate && !_argv.toDate && Number.isInteger(_argv._[0])) {
                const _date = moment()
                    .add(_argv._[0], 'day')
                    .format('MM/DD/YY');
                _argv.date = _date;
            }
            else {
                if(Object.keys(_argv).includes('date') && !_argv.date) {
                    _argv.date = moment().format('MM/DD/YY');
                }
                if(_argv.date && (_argv.fromDate || _argv.toDate)) {
                    throw new Error('--date cannot be used with "--from-date" or "--to_date"');
                }
            }
            return true;
        })
        .check(({ date }) => {
            if(date) {
                validateDate(date, '--date');
                if(isFuture(date)) {
                    throw new Error('--date cannot exceed current date');
                }
            }
            return true;
        })
        .check(({ fromDate }) => {
            if(fromDate) {
                validateDate(fromDate, '--from-date');
                if(isFuture(fromDate)) {
                    throw new Error('--from-date cannot exceed current date');
                }
            }
            return true;
        })
        .check(({ toDate }) => {
            if(toDate) {
                validateDate(toDate, '--to-date');
            }
            return true;
        })
        .check(({ folderNames }) => {
            if(folderNames && !folderNames.length) {
                throw new Error('--folder-names requires at least one name');
            }
            return true;
        })
        .check(validatePath)
        .argv;

    if(argv.date) {
        const date = moment(argv.date);
        module.exports.options.fromDate = date.clone().startOf('day');
        module.exports.options.toDate = date.clone().endOf('day');
    }
    else {
        module.exports.options.fromDate = argv.fromDate ? moment(argv.fromDate).startOf('day') : null;
        module.exports.options.toDate = argv.toDate ? moment(argv.toDate).endOf('day') : null;
    }
    module.exports.options.devRoot = argv.devRoot;
    module.exports.options.devRoot = argv.devRoot;
    module.exports.options.folderNames = argv.folderNames || [];
};

module.exports = {
    options
    , setOptions
};
