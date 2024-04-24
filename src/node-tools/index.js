import { type as osType } from 'node:os';
import yargs from 'yargs/yargs';
import { Engine, versionKeys } from '../common/engine.js';
import report from './report.js';
import fix from './fix.js';
import clean from './clean.js';
import remove from './remove.js';

// ... rest of your code ...

process.on('uncaughtException', (e) => {
    process.stdout.write(`${e.message}\n`);
    process.exitCode = 1;
});

/**
 * Tool only runs on windows for now.
 *
 * @returns {boolean}
 */
const validateWindows = () => {
    if(osType !== 'Windows_NT') {
        throw new Error('This tools only works on MS Windows');
    }
    return true;
};

const _yargs = yargs(process.argv.slice(2));
_yargs
    .command({
        command: [ '$0', 'report' ]
        , desc: 'Report on found executables'
        , builder: _yargs => {
            return _yargs
                .check((argv) => {
                    argv.installed = Engine.allInstalledNodeVersions();
                    return true;
                });
        }
        , handler: report
    })
    .command({
        command: 'fix'
        , description: 'fix errors found by report'
        , builder: _yargs => {
            return _yargs
                .option('execute', { alias: 'x', describe: 'do the removal instead of just showing', type: 'boolean', default: false })
                .option('mode', { alias: 'm', describe: 'fix with a symbolic link', type: 'string', choices: [ 'l', 'link', 'c', 'copy' ], default: 'copy' })
                .check(validateWindows)
                .check((argv) => {
                    switch (argv.mode) {
                    case 'l':
                    case 'link':
                        argv.mode = 'link';
                        break;
                    case 'c':
                    case 'copy':
                    default:
                        argv.mode = 'copy';
                        break;
                    }
                    return true;
                })
                .check((argv) => {
                    argv.installed = Engine.allInstalledNodeVersions();
                    return true;
                });
        }
        , handler: fix
    })
    .command({
        command: 'clean'
        , desc: 'remove symlinks created by an earlier version of dev-tools'
        , builder: _yargs => {
            return _yargs
                .option('dry-run', { alias: 'x', describe: 'show what will be fixed', type: 'boolean', default: false })
                .check(validateWindows)
                .check((argv) => {
                    argv.installed = Engine.allInstalledNodeVersions();
                    return true;
                });
        }
        , handler: clean
    })
    .command({
        command: 'remove'
        , desc: 'uninstall a node version if installed'
        , builder: _yargs => {
            return _yargs
                .option('execute', { alias: 'x', describe: 'actually perform the removal', type: 'boolean', default: false })
                .option('version', { ...versionKeys.version, required: true })
                .check(validateWindows)
                .check((argv) => {
                    argv.installed = Engine.allInstalledNodeVersions();
                    return true;
                });
        }
        , handler: remove
    });

// Main entry
_yargs.help(true)
    .version(false)
    .strict(true)
    .parse();
