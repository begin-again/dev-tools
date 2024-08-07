const git = require('simple-git');

/**
 * Determines if repo has any commits on current branch
 *
 * @param {string} repo - path to repository
 * @returns {Promise<{repo:string, error?:number}>} as Promise
  */
const hasCommits = async (repo) => {
    try {
        // @ts-ignore
        await git(repo).log();
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
        // @ts-ignore
        const { current } = await git(pathToProject).branch();
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
    // @ts-ignore
    return git(pathToProject).revparse({ 'HEAD': true });
};

/**
 * Updates local refs by performing a fetch
 *
 * @param  {string} repoPath
 * @return {Promise}
 */
const gitFetch = (repoPath) => {
    // @ts-ignore
    return git(repoPath).fetch();
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

    // @ts-ignore
    const stdout = await git(repoPath).raw('rev-list', options);
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
    // @ts-ignore
    const status = await git(repoPath).status();
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
        // @ts-ignore
        const { latest } = await git(repoPath).log();
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
