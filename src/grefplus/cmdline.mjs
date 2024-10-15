import { accessSync, constants, lstatSync } from 'node:fs';
import yargs from 'yargs/yargs';
import { DateTime } from 'luxon';

const options = {
    dateOptions: 'yyyy-MM-dd hh:mm:ss a'
    , allowedFormat: 'M/d/yy'
    , offset: 3
    , timePad: 12
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
        , describe: `Show refs later than and include this date, '${options.allowedFormat}'`
        , type: 'string'
        , requiresArg: true
    }
    , 'to-date': {
        alias: 't'
        , describe: `Show refs earlier than and including this date, , '${options.allowedFormat}'`
        , type: 'string'
        , requiresArg: true
    }
    , 'dev-root': {
        alias: 'r'
        , describe: 'root folder of development environment (/c/blah/blah). Default is DEVROOT'
        , type: 'array'

        , default: process.env.DEVROOT
    }
    , 'date': {
        alias: 'd'
        , describe: `shortcut to specify a single date, , '${options.allowedFormat}'. Default is today`
        , type: 'string'
        , requiresArgs: true
    }
};

/**
 * Validates from and to dates,
 *
 * @param {string} checkDate
 * @param {string} msg
 * @throws if date is not valid
 * @private
 */
const validateDate = (checkDate, msg) => {
    try {
        const parsed = DateTime.fromFormat(checkDate.toString(), options.allowedFormat);
        if(!parsed.isValid) {
            throw new Error('unknown format');
        }
        return true;
    }
    catch (e) {
        const error = new Error();
        error.message = `${msg} not recognized as a date [${checkDate}]. Valid formats are: ${options.allowedFormat}`;
        error.cause = e.message;
        throw error;
    }
};

/**
 * Aborts build if dev root path does not exist
 *
 * @param {string[]} devRoot
 * @throws if path not accessible
 * @private
 */
const validatePath = (devRoot) => {
    let problematicRoot = null;

    devRoot.forEach(root => {
        try {
            accessSync(root, constants.R_OK);
            if(!lstatSync(root).isDirectory()) {
                problematicRoot = root;
            }
        }
        catch (error) {
            problematicRoot = { root, error };
        }
    });

    if(problematicRoot) {
        throw new Error(`Unable to access specified dev root folder of '${problematicRoot.root}'. Due to ${problematicRoot.error.message}`);
    }
    return true;

};

/**
 * Determines if a date is in the future
 * @param {String} checkDate
 * @returns {Boolean}
 * @throws if checkDate is not valid date
 * @private
 */
const isFuture = (checkDate) => {
    const _date = DateTime.fromFormat(checkDate, options.allowedFormat);
    const endOfToday = DateTime.now().endOf('day');
    return _date > endOfToday;
};

/**
 * Parse command line and configures options
 *
 * @param {Boolean} [test] - used for testing only
 */
const setOptions = (test) => {
    const argv = test || yargs(process.argv.slice(2))
        // @ts-ignore
        .options(cmdKeys)
        .version(false)
        .help(true)
        .strict(true)
        .check((_argv) => {
            // super secret shortcut
            if(!_argv.date && !_argv.fromDate && !_argv.toDate && Number.isInteger(_argv._[0])) {
                const days = Number(_argv._[0]);
                const _date = DateTime
                    .fromFormat(days.toString(), options.allowedFormat)
                    .plus({ days })
                    .toFormat('MM/DD/YY');
                _argv.date = _date;
            }
            else {
                if(Object.keys(_argv).includes('date') && !_argv.date) {
                    _argv.date = DateTime.now().toFormat('MM/DD/YY');
                }
                if(_argv.date && (_argv.fromDate || _argv.toDate)) {
                    throw new Error('--date cannot be used with "--from-date" or "--to_date"');
                }
            }
            return true;
        })
        .check((argv) => {
            /** @type {string} */
            const dt = `${argv.date}` || '';
            if(dt) {
                validateDate(dt, '--date');
                if(isFuture(dt)) {
                    throw new Error('--date cannot exceed current date');
                }
            }
            return true;
        })
        .check((argv) => {
            /** @type {string} */
            const dt = `${argv.fromDate}` || '';
            if(dt) {
                validateDate(dt, '--from-date');
                if(isFuture(dt)) {
                    throw new Error('--from-date cannot exceed current date');
                }
            }
            return true;
        })
        .check((argv) => {
            /** @type {string} */
            const dt = `${argv.toDate}` || '';
            if(dt) {
                validateDate(dt, '--to-date');
            }
            return true;
        })
        .check((argv) => {
            const folderNames = Array.isArray(argv.folderNames) ? argv.folderNames : [];
            if(folderNames && !folderNames.length) {
                throw new Error('--folder-names requires at least one name');
            }
            return true;
        })
        .check(argv => {
            const devRoot = `${argv.devRoot}`;
            return validatePath(devRoot);
        })
        .argv;

    // @ts-ignore
    if(argv.date) {
        // @ts-ignore
        const date = DateTime.fromFormat(argv.date, options.allowedFormat);
        options.fromDate = date.startOf('day');
        options.toDate = date.endOf('day');
    }
    else {
        // @ts-ignore
        options.fromDate = argv.fromDate ? DateTime.fromFormat(argv.fromDate, options.allowedFormat).startOf('day') : null;
        // @ts-ignore
        options.toDate = argv.toDate ? DateTime.fromFormat(argv.toDate, options.allowedFormat).endOf('day') : null;
    }
    // @ts-ignore
    options.devRoot = argv.devRoot;
    // @ts-ignore
    options.folderNames = argv.folderNames || [];
};

export { options, setOptions };
