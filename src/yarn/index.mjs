
import { spawn } from 'node:child_process';
import { Engine } from '../common/engine.mjs';
import yargs from 'yargs/yargs';

const engine = new Engine();

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

const _yargs = yargs(process.argv.slice(2));
_yargs
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
                        const _version = Engine.versionStringToObject(version, engine.versions);
                        if(!_version) {
                            throw new RangeError(`The specified version '${version}' is not installed`);
                        }
                    }
                    return true;
                })
                .check(({ version, path, oldest }) => {
                    versionToUse = engine.versionToUseValidator({ path, version, oldest });
                    return Boolean(versionToUse);
                });
        },
        (argv) => {
            const _len = argv._.length ? `: ${argv._}` : ``;

            console.log(`launching yarn '${argv.command}' with version '${versionToUse.version}' in path '${argv.path}' ${_len}`);
            return spawner('yarn', argv.path, versionToUse.path, argv.command, ...argv._);
        });

_yargs.help(true)
    .version(false)
    .strict(true)
    .wrap(_yargs.terminalWidth())
    .parse();
