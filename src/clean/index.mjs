
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import yargs from 'yargs/yargs';
import { removeTarget, removeSonarTemp } from './clean.mjs';

const builds = /(^[a-z0-9]{32}$)|(^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$)/m;
const yarns = /^yarn--.+/m;

const _yargs = yargs(process.argv.slice(2));
_yargs
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
_yargs.help(true)
    .version(false)
    .strict(true)
    .parse();
