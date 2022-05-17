const util = require('util');
const exec = util.promisify(require('child_process').exec);

/**
 * Determines if repo has any commits on current branch
 *
 * @param {String} repo - path to repository
 * @returns {Object} as Promise
 * @returns o.repo - same as repo
 * @returns o.error - truthy if no commits
  */
const hasCommits = (repo) => {
    const cmd = `git -C ${repo} log --oneline -1`;
    const result = { repo };
    return exec(cmd)
        .then(() => result)
        .catch(() => {
            result.error = 1;
            return result;
        });
};

/**
 * Retrieves branch name from local repo
 *
 * @param  {String} pathToProject
 * @returns {Promise} branch name
 */
const currentBranch = (pathToProject) => {
    const cmd = `git -C ${pathToProject} rev-parse --abbrev-ref HEAD`;
    return exec(cmd)
        .then(out => {
            return out.stdout.trim();
        });
};

/**
 * Retrieves commit hash of local head
 *
 * @param  {String} pathToProject [description]
 * @returns {String}
 */
const currentHash = (pathToProject) => {
    const cmd = `git -C ${pathToProject} rev-parse HEAD`;
    return exec(cmd)
        .then(out => {
            return out.stdout.trim();
        });
};

/**
 * Updates local refs by performing a fetch
 *
 * @param  {String} repoPath
 * @return {Promise}
 */
const gitFetch = (repoPath) => {
    const cmd = `git -C ${repoPath} fetch -q`;
    return exec(cmd);
};

/**
 * Counts number of commits a branch has which is not on master
 *
 * @param {String} repoPath
 * @param {String} branch
 * @param {Boolean} isTotal
 * @returns {Promise} number of commits
 */
const commitsDiff = (repoPath, branch = 'master', isTotal = false) => {
    const cmd = isTotal ?
        `git -C ${repoPath} rev-list origin/${branch}...HEAD | wc -l` :
        `git -C ${repoPath} rev-list origin/${branch}..HEAD | wc -l`
    ;
    return exec(cmd).then(out => Number(out.stdout.trim()));
};

/**
 * Calculate ahead and behind commits counts
 *
 * @private
 * @param {Array} results
 * @returns {Object} { ahead: Integer, behind: Integer }
 */
const diffResult = (results) => {
    const ahead = results[1];
    const behind = results[0] > 0 ? results[0] - results[1] : 0;
    return { ahead, behind };
};

/**
 * Count commits which differ between origin and local
 *
 * @param  {String} repoPath
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
 * Check status for un-committed changes
 *
 * @param  {String} repoPath - resolved path to repository
 * @param  {String} limitTo - file or folder in repo
 * @return {Promise<Boolean>} true is dirty
 */
const isDirty = (repoPath, limitTo = '') => {
    let cmd = `git -C ${repoPath} status --porcelain`;
    if(limitTo) {
        cmd = `git -C ${repoPath} status --porcelain ${limitTo}`;
    }
    return exec(cmd, { encoding: 'utf8', cwd: repoPath })
        .then(({ stdout }) => stdout.length > 0)
        .catch(err => {
            // caused by lots of uncommitted files
            if(err.message === 'stdout maxBuffer exceeded') {
                return true;
            }
            throw err;
        });
};

/**
 * Obtain log message of HEAD
 *
 * @param {String} repoPath
 * @param {Object} logger
 * @returns {Promise} standard out
 */
const headLog = (repoPath, logger) => {
    const cmd = `git -C ${repoPath} log -1 --format="%n%s%n%b"`;
    return exec(cmd, { encoding: 'utf8', cwd: repoPath })
        .then(
            ({ stdout }) => stdout
            , err => {
                if(logger) {
                    logger.error(`${err.message.replace(/\n/, ', ')}`);
                }
                throw new Error('Unable to obtain previous commit log');
            }
        );
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
