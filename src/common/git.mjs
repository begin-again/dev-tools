import { simpleGit } from 'simple-git';

/**
 * Determines if repo has any commits on current branch
 *
 * @param {string} repo - path to repository
 * @returns {Promise<object>} as Promise
 * @returns o.repo - same as repo
 * @returns o.error - truthy if no commits
  */
const hasCommits = async (repo) => {
    try {
        await simpleGit(repo).log();
        return { repo };
    }
    catch (err) {
        if(err) {
            return { repo, error: 1 };
        }
    }
};

/**
 * Retrieves branch name from local repo
 *
 * @param  {string} pathToProject
 * @returns {Promise<string>} branch name
 */
const currentBranch = async (pathToProject) => {
    try {
        const { current } = await simpleGitpathToProject).branch();
        return current || 'HEAD';
    }
    catch (err) {
        return Promise.reject(err);
    }

};

/**
 * Retrieves commit hash of local head
 *
 * @param  {string} pathToProject [description]
 * @returns {Promise<string>}
 */
const currentHash = (pathToProject) => {
    return simpleGit(pathToProject).revparse({ 'HEAD': true });
};

/**
 * Updates local refs by performing a fetch
 *
 * @param  {string} repoPath
 * @return {Promise}
 */
const gitFetch = (repoPath) => {
    return simpleGit(repoPath).fetch();
};

/**
 * Counts number of commits a branch has which is not on master
 *
 * @param {string} repoPath
 * @param {string} branch
 * @param {boolean} isTotal
 * @returns {Promise} number of commits
 */
const commitsDiff = async (repoPath, branch = 'master', isTotal = false) => {
    const options = {};
    const dots = isTotal ? '...' : '..';
    const option = `origin/${branch}${dots}HEAD`;
    options[option] = true;

    const stdout = await simpleGit(repoPath).raw('rev-list', options);
    const out = `${stdout}`.trim();
    if(out.length) {
        return out.split('\n').length;
    }
    return 0;
};

/**
 * Calculate ahead and behind commits counts
 *
 * @private
 * @param {array} results
 * @returns {{ahead:number, behind:number}} { ahead: Integer, behind: Integer }
 */
const diffResult = (results) => {
    const ahead = results[1];
    const behind = results[0] > 0 ? results[0] - results[1] : 0;
    return { ahead, behind };
};

/**
 * Count commits which differ between origin and local
 *
 * @param  {string} repoPath
 * @returns {Promise} { ahead: Integer, behind: Integer }
 */
const commitDiffCounts = (repoPath) => {

    return gitFetch(repoPath)
        .then(() => currentBranch(repoPath))
        .then(branch => {
            return Promise
                .all([
                    commitsDiff(repoPath, branch, true)
                    , commitsDiff(repoPath, branch)
                ])
                .then(diffResult);
        })
        .catch(err => {
            return { error: err.message };
        });
};

/**
 * Check status for un-committed changes including untracked files
 *
 * @param  {string} repoPath - resolved path to repository
 * @return {Promise<boolean>} true is dirty
 */
const isDirty = async (repoPath) => {
    const status = await simpleGit(repoPath).status();
    const clean = status.isClean();
    const untracked = status.not_added.length > 0;
    return !clean || untracked;
};

/**
 * Obtain log message of HEAD
 *
 * @param {string} repoPath
 * @param {object} logger
 * @returns {Promise} standard out
 */
const headLog = async (repoPath, logger) => {
    try {
        const { latest } = await simpleGit(repoPath).log();
        return latest.message;
    }
    catch (err) {
        if(logger) {
            logger.error(`${err.message.replace(/\n/g, ', ')}`);
        }
        throw new Error('Unable to obtain previous commit log');
    }
};

module.exports = {
    commitsDiff
    , commitDiffCounts
    , currentBranch
    , currentHash
    , gitFetch
    , hasCommits
    , headLog
    , isDirty
};
