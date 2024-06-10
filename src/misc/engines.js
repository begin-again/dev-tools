import { repositoryEngines } from '../common/engine.js';
import { findFirstFile } from '../common/files.js';
import yargs from 'yargs/yargs';
const pwd = process.cwd();
const options = {
    'path': {
        alias: 'p'
        , describe: 'path to start search for package file'
        , type: 'string'
        , default:pwd
    }
};

const { argv } = yargs(process.argv.slice(2))
    .option(options)
    .version(false);

/**
 * @param {object} param0
 * @param {string} param0.path
 */
const main = ({ path }) => {
    const file = findFirstFile('package.json', path);
    if(!file) {
        throw new Error(`unable to find package.json file in '${path}'`);
    }

    process.stdout.write(`${repositoryEngines(file)}\n`);
};

main(argv);
