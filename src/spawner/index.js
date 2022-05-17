
const { spawn } = require('child_process');
const { engines } = require('../package.json');
const { node } = engines;
require('../common/engine').properNodeVersions();
const {
    engineCheck
    , versionStringToObject
    , versionToUseValidator
    , versions
} = require('../common/engine');
engineCheck(node);
const yargs = require('yargs');

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
        // eslint-disable-next-line no-process-env
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

yargs
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
                    if(name.toLowerCase() === 'node') {
                        if(command) {
                            throw new Error('node cli does not support commands');
                        }
                    }
                    return true;
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
            if(argv.log) {
                process.stdout.write(`launching ${argv.name}${argv.command.length ? ` '${argv.command}'` : ``} with version '${versionToUse.version}' in path '${argv.path}' ${argv._.length ? `: ${argv._.join(', ')}` : ``}\n`);
            }
            return spawner(argv.name, argv.path, versionToUse.path, argv.command, ...argv._);
        });

yargs.help(true)
    .version(false)
    .strict(true)
    .wrap(yargs.terminalWidth())
    .parse();
