import { basename } from 'node:path';
import { options } from './cmdline.js';
import { currentBranch, currentHash, commitDiffCounts, isDirty } from '../common/git.js';
const hashLength = 7;

/**
 * String sort
 *
 * @param {String} a
 * @param {String} b
 * @private
 */
const sorter = (a, b) => {
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
};

/**
 * Creates formatted report
 *
 * @param {Array} results
 * @returns {String}
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
 * @param  {String} repoPath
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
            const result = { name: basename(repoPath), branch: results[0], head: results[1], dirty: results[2] };
            if(results[3]) {
                result.fetch = { ahead: results[3].ahead, behind: results[3].behind };
            }
            return result;
        });
};

export {
    branches
    , report
};
