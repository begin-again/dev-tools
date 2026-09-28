import { basename } from 'node:path';

import { DateTime } from 'luxon';
import { simpleGit } from 'simple-git';

import { allRepoPaths } from '../common/repos.js';
import { options, setOptions } from './cmdline.js';

const DateLength = 6;

setOptions();

/**
 * Determines if item falls within range
 *
 * @param {object} item
 * @param {DateTime | undefined} item.date
 * @returns {boolean}
 * @private
 */
export function filterPeriod(item) {
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
 *
 * @param {string} repo - full path to a repository
 * @param {{repo:string, error:string}[]} errors - place to store skippable errors
 * @returns {Promise<{date: DateTime, body: string, repo: string}[]>}
 */
export async function processRepo(repo, errors, gitFactory = simpleGit) {
    try {
        const git = gitFactory({
            baseDir: repo
        });

        const stdout = await git.raw([
            'log',
            '--walk-reflogs',
            '--format=%gd %h %d %gs +++',
            '--date=format:%Y-%m-%d %H:%M:%S %p=='
        ]);

        const lines = [];
        const repoName = basename(repo);

        for(const item of stdout.trim().split(' +++')) {
            const current = item.trim();
            if(current.length === 0) {
                continue;
            }

            const markerIndex = current.indexOf('==');
            const date = DateTime.fromFormat(
                current.substring(DateLength, markerIndex),
                options.dateOptions
            );

            if(!filterPeriod({ date })) {
                continue;
            }

            const body = current.substring(markerIndex + options.offset);

            lines.push({
                date,
                body,
                repo: repoName
            });
        }

        return lines;
    }
    catch (err) {
        errors.push({
            repo,
            error: err ? err.message : 'Unknown error'
        });

        return [];
    }
}

/**
 * Writes errors to console if in debug mode
 *
 * @param {Array} errors - collection of error objects
 * @param {Boolean} isDebug - command line flag
 * @param {*} err - catch all error not otherwise specified
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
export async function main() {
    if(options.devRoot.length === 0) {
        console.log('bash variable DEVROOT is required');
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

    try {
        const result = [];
        const concurrency = 8;

        for(let i = 0; i < repos.length; i += concurrency) {
            const batch = repos
                .slice(i, i + concurrency)
                .map(repo => processRepo(repo, errors));

            result.push(...await Promise.all(batch));
        }

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
