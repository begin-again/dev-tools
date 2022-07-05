/* eslint-disable no-console */

const { repositoryEngines } = require('../common/engine');
const { findFirstFile } = require('../common/files');
const yargs = require('yargs');

const main = () => {
    let file = '';
    // eslint-disable-next-line no-unused-vars
    const { argv } = yargs
        .option('path', {
            alias: 'p'
            , describe: 'path to the package file'
            , type: 'string'
            , default: process.cwd()
        })
        .version(false)
        .help(true)
        .check(({ path }) => {
            file = findFirstFile('package.json', path);
            if(!file) {
                throw new Error(`unable to find package.json file in '${path}'`);
            }
            return true;
        });

    process.stdout.write(`${repositoryEngines(file)}\n`);
};

main();
