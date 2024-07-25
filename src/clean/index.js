
const { removeTarget, removeSonarTemp } = require('./clean');
const { join } = require('path');
const { existsSync } = require('fs');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

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
            , default: join(process.env.HOME, '.sonarlint')
        })
        .option('age', {
            alias: 'a'
            , describe: 'how many days to keep. Must be an integer > 1'
            , type: 'number'
            , default: 2
        })
        .option('logger', {
            type: 'object'
            , default: console
            , hidden: true
        })
        .check(argv => {
            if(existsSync(argv.root)) {
                return true;
            }
            throw new Error('root path not found');
        })
        .check(argv => {
            // eslint-disable-next-line no-magic-numbers
            if(argv.age > 1 && argv.age <= 100 && Number.isInteger(argv.age)) {
                return true;
            }
            throw new Error('age must be > 1');
        })
    , handler: async (args) => {
        const { root, age, logger } = args;
        try {
            const result = await removeSonarTemp({ root, age }, logger);
            logger.info(`sonar cleanup completed, ${result} folders removed`);
        }
        catch (err) {
            logger.error(err.message);
        }
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
