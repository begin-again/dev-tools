
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { fileExists } from '../common/files.mjs';
import { Engine, repositoryEngines } from '../common/engine.mjs';
import yargs from 'yargs/yargs';

const engine = new Engine();

/**
 *
 * @param {String} cliName - cli, or alias, to spawn
 * @param {String} pathToActOn
 * @param {String} pathToNodeBinary
 * @param  {Array<String>} myArgs
 */
const spawner = (command, pathToActOn, pathToNodeBinary, ...myArgs) => {
    const opts = {
        cwd: pathToActOn

        , env: { ...process.env, PATH: `${pathToNodeBinary};${process.env.PATH}` }
        , encoding:'utf8'
        , shell: true
        , stdio: [ process.stdin, process.stdout, process.stderr ]
    };
    const child = spawn(command, myArgs, opts);
    child.on('close', code => {
        process.exitCode = code;
    });
};

let versionToUse;

const _yargs = yargs(process.argv.slice(2));
_yargs
    .command([ '$0' ], 'run a cli without changing node version',
        yargs => {
            return yargs
                .usage('Usage: sp -n <name> -c [cmd] -p [path] -v [version] -- [options for name]')
                .options('name', {
                    describe: 'cli name to spawn'
                    , type: 'string'
                    , default: 'node'
                    , alias: 'n'
                })
                .options('command', {
                    describe: 'command to run for CLIs which have commands (e.g, "yarn install" where "install" is the command)'
                    , type: 'string'
                    , default: ''
                    , alias: 'c'
                })
                .option('path', {
                    describe: 'path to act on. (default is current working directory)'
                    , type: 'string'
                    , default: process.cwd()
                    , alias: 'p'
                })
                .option('version', {
                    describe: 'specify an already installed NodeJS version (M.m.p | M.m | M). Check \'nvm ls\' to see availability'
                    , type: 'string'
                    , alias: 'v'
                })
                .option('oldest', {
                    describe: 'choose oldest satisfying NodeJS version'
                    , type: 'boolean'
                    , default: false
                    , alias: 'o'
                })
                .option('log', {
                    describe: 'Show info message prior to launch'
                    , type: 'boolean'
                    , default: false
                    , alias: 'l'
                })
                .check(({ name, command }) => {
                    if(name.toLowerCase() === 'node' && command) {
                        throw new Error('node cli does not support commands');
                    }
                    return true;
                })
                .check(({ version }) => {
                    if(version) {
                        const _version = engine.versionStringToObject(version, engine.versions);
                        if(!_version) {
                            throw new RangeError(`The specified version '${version}' is not installed`);
                        }
                    }
                    return true;
                })
                .check(({ version, path, oldest }) => {
                    const hasPackage = path.endsWith('package.json') || fileExists(join(path, 'package.json'));
                    let allowedEngines = '';
                    if(hasPackage) {
                        allowedEngines = repositoryEngines(path);
                    }
                    versionToUse = engine.versionToUseValidator({ path, version, oldest }, { noPackage: !hasPackage, repositoryEngines: allowedEngines });
                    return Boolean(versionToUse);
                });
        },
        (argv) => {
            if(argv.log) {
                const argCommand = argv.command.length ? '"argv.command"' : '';
                process.stdout.write(`launching ${argv.name}${argCommand} with version '${versionToUse.version}' in path '${argv.path}' ${argv._.join(', ')}\n`);
            }
            return spawner(argv.name, argv.path, versionToUse.path, argv.command, ...argv._);
        })
    .help(true)
    .version(false)
    .wrap(_yargs.terminalWidth())
    .strict(true)
    .parse();
