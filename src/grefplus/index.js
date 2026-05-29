/* eslint no-console:off */
require('./cmdline').setOptions();
const { basename } = require('node:path');
const { allRepoPaths } = require('../common/repos');
const { promisify } = require('node:util');
const _exec = promisify(require('node:child_process').exec);
const { DateTime } = require('luxon');
const { options } = require('./cmdline');
const DateLength = 6;

/**
 * Creates command string
 * @param  {String} repo - repository base name
 * @return {String}
 * @NOTE git will walk up the parents looking for a repository
 * @private
 */
const gitCommand = (repo) => {
    return `git --no-pager -C ${repo} log --walk-reflogs --format="%gd %h %d %gs +++" --date=format:"%Y-%m-%d %H:%M:%S %p=="`;
};

/**
 * determines if item falls within range
 *
 * @param {object} item
 * @param {DateTime | undefined} item.fromDate
 * @param {DateTime | undefined} item.toDate
 * @returns {boolean}
 * @private
 *
 */
const filterPeriod = (item) => {
    let result;
    if(!options.fromDate && !options.toDate) {
        result = true;
    }
    else if(options.fromDate && !options.toDate) {
        result = item.date >= options.fromDate;
    }
    else if(!options.fromDate && options.toDate) {
        result = item.date <= options.toDate;
    }
    else {
        result = item.date >= options.fromDate && item.date <= options.toDate;
    }
    return result;
};

/**
 * Obtains the git reflogs result
 * @param  {string} repo - full path to a repository
 * @param  {Array}  errors - place to store skippable errors
 * @return {Promise<{date: DateTime, body: string, repo: string}[]>}  objects containing date, body, and the repository base name
 */
async function processRepo(repo, errors) {
    try {
        const cmd = gitCommand(repo);
        const { stdout } = await _exec(cmd, { encoding:'utf8' });
        const lines = [];
        const repoName = basename(repo);
        for(const item of stdout.trim().split(' +++')) {
            const _item = item.trim();
            if(_item.length === 0) {
                continue;
            }

            const markerIndex = _item.indexOf('==');
            const date = DateTime.fromFormat(_item.substring(DateLength, markerIndex), options.dateOptions);
            if(!filterPeriod({ date })) {
                continue;
            }

            const body = _item.substring(markerIndex + options.offset);
            lines.push({ date, body, repo: repoName });
        }
        return lines;
    }
    catch (err) {
        errors.push({ repo: basename(repo), error: err ? err.message : 'Unknown error' });
        // continue to next repo but be sure to return empty array
        return [];
    }
}

/**
 * writes errors to console if in debug mode
 * @param  {Array}   errors - collection of error objects
 * @param  {Boolean} isDebug - command line flag
 * @param  {*}       err - catch all error not otherwise specified
 */
const logErrors = (errors, isDebug, err) => {
    if(isDebug > 0 && errors.length > 0) {
        console.error(`Errors Reported: ${errors.length}`);
        errors.forEach((item, i) => {
            console.error(`${i + 1}. ${item.repo}: ${item.error.trim()}`);
        });
    }
    if(err) {
        console.error(`Misc error: ${err}`);
    }
};

/**
 * Entry point
 */
async function main() {
    if(options.devRoot.length === 0) {
        console.log(`bash variable DEVROOT is required`);
        process.exitCode = 1;
        return;
    }

    const errors = [];
    let maxRepoLength = 0;
    const repos = [];
    for(const root of options.devRoot) {
        const paths = await allRepoPaths(root, options.folderNames);
        repos.push(...paths);
    }
    const promises = repos.map(repo => processRepo(repo, errors));

    try {
        const result = await Promise.all(promises);
        const sorted = result
            .flat()
            .sort((a, b) => a.date.valueOf() - b.date.valueOf());
        sorted.forEach(item => {
            maxRepoLength = Math.max(maxRepoLength, item.repo.length);
        });
        sorted.forEach(item => {
            console.log(`${item.date.toFormat(options.dateOptions)}  ${item.repo.padEnd(maxRepoLength)}  ${item.body}`);
        });
    }
    catch (err) {
        logErrors(errors, options.debug, err);
    }

}

main().catch(console.error);
