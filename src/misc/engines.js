/* eslint-disable no-console */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { repositoryEngines } from '../common/engine.js';
import { findFirstFile } from '../common/files.js';

const pwd = process.cwd();
const options = {
    'path': {
        alias: 'p'
        , describe: 'path to start search for package file'
        , type: 'string'
        , default:pwd
    }
};

const { argv } = yargs(hideBin(process.argv))
    .option(options)
    .version(false);

/**
 * @param {object} param0
 * @param {string} param0.path
 */
async function main({ path }) {
    const file = findFirstFile('package.json', path);
    if(!file) {
        throw new Error(`unable to find package.json file in '${path}'`);
    }

    const engines = await repositoryEngines(file);
    process.stdout.write(`${engines}\n`);
};

try {
    await main(argv);
} catch (error) {
    console.error(error);
}
