
import { spawn } from 'node:child_process';
import { properNodeVersions, versionStringToObject, versionToUseValidator, versions } from '../common/engine.mjs';
import yargs from 'yargs';

properNodeVersions();

/**
 *
 * @param {String} command
 * @param {String} pathToActOn
 * @param {String} pathToNodeBinary
 * @param  {Array<String>} yarnArgs
 */
const spawner = (command, pathToActOn, pathToNodeBinary, ...yarnArgs) => {
    const opts = {
        cwd: pathToActOn

        , env: { ...process.env, PATH: `${pathToNodeBinary};${process.env.PATH}` }
        , encoding:'utf8'
        , shell: true
        , stdio: [ process.stdin, process.stdout, process.stderr ]
    };
    const child = spawn(command, yarnArgs, opts);
    child.on('close', code => {
        process.exitCode = code;
    });
};

let versionToUse;


yargs
    .command([ '$0' ], 'run yarn without changing node version',
        _yargs => {
            return _yargs
                .usage('Usage: yn -c <cmd> -p [path] -v [version] -- [yarn options]')
                .options('command', {
                    describe: 'yarn command to run.'
                    , type: 'string'
                    , default: 'install'
                    , alias: 'c'
                })
                .option('path', {
                    describe: 'path to act on'
                    , type: 'string'
                    , default: process.cwd()
                    , alias: 'p'
                })
                .option('version', {
                    describe: 'specify an already installed NodeJS version. Check \'nvm ls\' to see availability'
                    , type: 'string'
                    , alias: 'v'
                })
                .option('oldest', {
                    describe: 'choose oldest satisfying NodeJS version'
                    , type: 'boolean'
                    , default: false
                    , alias: 'o'
                })
                .check(({ version }) => {
                    if(version) {
                        const _version = versionStringToObject(version, versions);
                        if(!_version) {
                            throw new RangeError(`The specified version '${version}' is not installed`);
                        }
                    }
                    return true;
                })
                .check(({ version, path, oldest }) => {
                    versionToUse = versionToUseValidator({ path, version, oldest });
                    return Boolean(versionToUse);
                });
        },
        (argv) => {
            const _len = argv._.length ? `: ${argv._}` : ``;

            console.log(`launching yarn '${argv.command}' with version '${versionToUse.version}' in path '${argv.path}' ${_len}`);
            return spawner('yarn', argv.path, versionToUse.path, argv.command, ...argv._);
        });

yargs.help(true)
    .version(false)
    .strict(true)
    .wrap(yargs.terminalWidth())
    .parse();
