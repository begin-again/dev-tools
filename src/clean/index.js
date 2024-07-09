
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { removeTarget, removeSonarTemp } from './clean.js';

const builds = /(^[a-z0-9]{32}$)|(^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$)/m;
const yarns = /^yarn--.+/m;

const sonar = {
    command: 'sonar'
    , desc: 'Remove excess sonar work folders'
    , builder: yargs => yargs
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
        })
    , handler: async (args) => {
        const { root, age, logger } = args;
        try {
            const result = await removeSonarTemp({ root, age, logger });
            logger.info(`sonar cleanup completed, ${result} folders removed`);
        }
        catch (err) {
            logger.error(err.message);
        }
        removeSonarTemp({ root, age, logger });
    }
};

const yarnArtifacts = {
    command: [ '$0', 'yarn', 'yn' ]
    , desc: 'Remove yarn temp files'
    , handler: () => removeTarget('Yarn', yarns)
};

const buildArtifacts = {
    command: [ 'builder', 'b' ]
    , desc: 'Remove builder temp files'
    , handler: () => removeTarget('Builder', builds)
};

yargs(hideBin(process.argv))
    .command(sonar)
    .command(yarnArtifacts)
    .command(buildArtifacts)
    .help(true)
    .version(false)
    .strict(true)
    .parse();
