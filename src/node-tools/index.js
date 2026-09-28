import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import {
    allInstalledNodeVersions,
    versionKeys
} from '../common/engine.js';

import clean from './clean.js';
import fix from './fix.js';
import remove from './remove.js';
import report from './report.js';

/**
 * Adds the installed Node.js versions to the parsed arguments.
 *
 * @param {object} argv - Parsed command arguments.
 * @returns {boolean}
 */
const addInstalledVersions = (argv) => {
    argv.installed = allInstalledNodeVersions();

    return true;
};

/**
 * Normalizes the fix mode.
 *
 * @param {object} argv - Parsed command arguments.
 * @returns {boolean}
 */
const normalizeFixMode = (argv) => {
    argv.mode = [ 'l', 'link' ].includes(argv.mode)
        ? 'link'
        : 'copy';

    return true;
};

process.on('uncaughtException', function(error) {
    process.stdout.write(`${error.message}\n`);
    process.exitCode = 1;
});

yargs(hideBin(process.argv))
    .command({
        command: [ '$0', 'report' ],
        desc: 'Report on found Node.js installations',
        builder: _yargs =>
            _yargs.check(addInstalledVersions),
        handler: report
    })
    .command({
        command: 'fix',
        desc: 'Attempt to fix unusable Node.js installations',
        builder: _yargs =>
            _yargs
                .option('execute', {
                    alias: 'x',
                    describe: 'perform the fix instead of just showing it',
                    type: 'boolean',
                    default: false
                })
                .option('mode', {
                    alias: 'm',
                    describe: 'fix using a symbolic link or copy',
                    type: 'string',
                    choices: [
                        'l',
                        'link',
                        'c',
                        'copy'
                    ],
                    default: 'copy'
                })
                .check(normalizeFixMode)
                .check(addInstalledVersions),
        handler: fix
    })
    .command({
        command: 'clean',
        desc: 'remove Node.js executable symbolic links',
        builder: _yargs =>
            _yargs
                .option('execute', {
                    alias: 'x',
                    describe: 'perform the removal instead of just showing it',
                    type: 'boolean',
                    default: false
                })
                .check(addInstalledVersions),
        handler: clean
    })
    .command({
        command: 'remove',
        desc: 'uninstall an installed Node.js version',
        builder: _yargs =>
            _yargs
                .option('execute', {
                    alias: 'x',
                    describe: 'perform the removal instead of just showing it',
                    type: 'boolean',
                    default: false
                })
                .option('version', {
                    ...versionKeys.version,
                    required: true
                })
                .check(addInstalledVersions),
        handler: remove
    })
    .help()
    .version(false)
    .strict()
    .parse();