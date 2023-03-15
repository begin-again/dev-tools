
const { removeTarget, removeSonarTemp } = require('./clean');
const { join } = require('path');
const { existsSync } = require('fs');
const yargs = require('yargs');

const builds = /(^[a-z0-9]{32}$)|(^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$)/m;
const yarns = /^yarn--.+/m;



yargs
    .command({
        command: [ 'sonar' ]
        , desc: 'Remove excess sonar work folders'
        , builder: _yargs => {
            return _yargs
                .option('root', {
                    alias: 'r'
                    , describe: 'root path of work folders'
                    , type: 'string'
                    , default: join(process.env.HOME, '.sonarlint', 'work')
                })
                .option('age', {
                    alias: 'd'
                    , describe: 'age in days to retain'
                    , type: 'number'
                    , default: 2
                })
                .check(argv => {
                    if(existsSync(argv.root)) {
                        return true;
                    }
                    throw new Error('root path not found');
                });
        }
        , handler: removeSonarTemp
    })
    .command({
        command: [ '$0', 'yarn', 'yn' ]
        , desc: 'Remove yarn temp files'
        , handler: () => removeTarget('Yarn', yarns)
    })
    .command({
        command: [ 'builder', 'b' ]
        , desc: 'Remove builder temp files'
        , handler: () => removeTarget('Builder', builds)
    });


// Main entry
yargs.help(true)
    .version(false)
    .strict(true)
    .parse();
