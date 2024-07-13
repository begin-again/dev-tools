import { basename } from 'node:path';
import { options } from './cmdline.js';
import { currentBranch, currentHash, commitDiffCounts, isDirty } from '../common/git.js';
const hashLength = 7;

/**
 * @typedef {object} BranchReport
 * @property {string} name
 * @property {string} branch
 * @property {string} head
 * @property {boolean} dirty
 * @property {{ahead:number, behind:number}} [fetch]
 *
 */

/**
 * String sort
 *
 * @param {BranchReport} a
 * @param {BranchReport} b
 * @private
 */
const sorter = (a, b) => {
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
};

/**
 * Creates formatted report
 *
 * @param {BranchReport[]} results
 * @returns {string[]}
 */
const report = (results) => {
    results.sort(sorter);
    return results
        .map(repo => {
            let out = repo.name;
            let status = '';
            if(options.fetch) {
                if((repo.fetch.ahead + repo.fetch.behind) > 0) {
                    status = ' | ';
                    status += `ahead ${repo.fetch.ahead} : behind ${repo.fetch.behind}`;
                }
            }
            out += ' | ';
            out += repo.branch;
            if(repo.dirty) {
                out += `*`;
            }
            out += ' | ';
            out += repo.head.substring(0, hashLength);
            out += status;
            return out;
        });
};

/**
 * Fetches and prepares output for a repository
 *
 * @param  {string} repoPath
 * @returns {Promise<BranchReport>}
 */
const branches = (repoPath) => {
    const promises = [
        currentBranch(repoPath)
        , currentHash(repoPath)
        , isDirty(repoPath)
    ];
    if(options.fetch) {
        promises.push(commitDiffCounts(repoPath));
    }
    return Promise.all(promises)
        .then(results => {
            const [ branch, head, dirty, fetch = { ahead:0, behind:0 } ] = results;

            /** @type {BranchReport} */
            const result = {
                name: basename(repoPath)
                , branch, head, dirty
                , fetch
            };

            return result;
        });
};

export {
    branches
    , report
};
