/* eslint no-console:off */
require('./cmdline').setOptions();
const { basename } = require('path');
const { allRepoPaths } = require('../common/repos');
const { promisify } = require('util');
const _exec = promisify(require('child_process').exec);
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
 * @param {Object} item
 * @param {DateTime | undefined} item.fromDate
 * @param {DateTime | undefined} item.toDate
 * @returns {Boolean}
 * @private
 *
 */
const filterPeriod = (item) => {
    let result;
    if(!options.fromDate && !options.toDate) {
        result = true;
    }
    else if(options.fromDate && !options.toDate) {
        // result = item.date.isSameOrAfter(options.fromDate);
        result = item.date >= options.fromDate;
    }
    else if(!options.fromDate && options.toDate) {
        // result = item.date.isSameOrBefore(options.toDate);
        result = item.date <= options.toDate;
    }
    else {
        // result = item.date.isBetween(options.fromDate, options.toDate);
        result = item.date >= options.fromDate && item.date <= options.toDate;
    }
    return result;
};

/**
 * Obtains the git reflogs result
 * @param  {String} repo - full path to a repository
 * @param  {Array}  errors - place to store skippable errors
 * @return {Array}  objects containing date, body, and the repository base name
 */
const processRepo = (repo, errors) => {
    return new Promise((resolve) => {
        const cmd = gitCommand(repo);
        _exec(cmd, { encoding:'utf8' })
            .then(out => out.stdout.trim())
            .then(stdout => {
                const results = stdout.split(' +++')
                    .filter(item => {
                        return item.trim().length > 0;
                    })
                    .map(item => {
                        return item.trim();
                    })
                    .map(item => {
                        const date = DateTime.fromFormat(item.substring(DateLength, item.search(/[=]{2}/)), options.dateOptions);
                        const body = item.substring(item.search(/[=]{2}/) + options.offset);
                        return { date, body, repo: basename(repo) };
                    })
                    .filter(filterPeriod);
                return resolve(results);
            })
            .catch(err => {
                errors.push({ repo: repo, error: err });
                // continue to next repo but be sure to return empty array
                return resolve([]);
            });
    });
};

/**
 * writes errors to console if in debug mode
 * @param  {Array}   errors - collection of error objects
 * @param  {Boolean} isDebug - command line flag
 * @param  {*}       err - catch all error not otherwise specified
 */
const logErrors = (errors, isDebug, err) => {
    if(isDebug > 0 && errors.length > 0) {
        console.error(`Errors Reported: ${errors.length}`);
        errors.map((item, i) => {
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
const main = () => {
    if(options.devRoot) {
        const errors = [];
        let maxRepoLength = 0;
        const promises = allRepoPaths(options.devRoot, options.folderNames)
            .map(repo => processRepo(repo, errors));

        return Promise
            .all(promises)
            .then(results => {
                results
                    .reduce((acc, item) => acc.concat(item), [])
                    .sort((a, b) => a.date.valueOf() - b.date.valueOf())
                    .map(item => {
                        if(item.repo.length > maxRepoLength) {
                            maxRepoLength = item.repo.length;
                        }
                        return item;
                    })
                    .map(item => {
                        let name = item.repo;
                        name = name.padEnd(maxRepoLength);
                        console.log(`${item.date.toFormat(options.dateOptions)}  ${name}  ${item.body}`);
                    });
            })
            .catch(err => {
                logErrors(errors, options.debug, err);
            });
    }

    console.log(`bash variable DEVROOT is required`);
    process.exitCode = 1;
};

main();
