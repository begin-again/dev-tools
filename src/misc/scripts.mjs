/* eslint-disable no-console */

import yargs from 'yargs';
import { findFirstFile, fileAsJSON } from '../common/files.mjs';

/**
 * Writes scripts block to console from first package file found in specified path
 */
const main = async () => {

    const { argv } = yargs
        .option('path', {
            alias: 'p'
            , describe: 'path to start looking for the package file'
            , type: 'string'
            , default: process.cwd()
        });

    const file = findFirstFile('package.json', argv.path);
    if(!file) {
        console.error(`file ${argv.path} not found`);
        process.exitCode = 1;
    }

    const { scripts } = await fileAsJSON(file);

    let keyMax = 0;
    Object.keys(scripts).forEach(key => {
        key.length > keyMax && (keyMax = key.length);
    });
    Object.entries(scripts).forEach(([ key, value ]) => {
        console.log(`${key.padEnd(keyMax)}: ${value}`);
    });

};

main().catch(console.error);
