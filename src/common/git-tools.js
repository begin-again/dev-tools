/**
 * @module Git-Tools
 */
const { execSync } = require('child_process');
const fs = require('node:fs');
const { join } = require('node:path');
const randomize = require('randomatic');
const { createTempFolder } = require('./temp');
const git = require('simple-git');

const commitLength = 20;

/**
 * initializes and empty git repository
 * into a temp folder within the base temp folder
 *
 * @param {string} nameOfFileToCommit - name
 */
const createRepo = async (nameOfFileToCommit = '') => {
    const path = createTempFolder();
    if(nameOfFileToCommit) {
        await git(path).init();
        execSync(`git -C ${path} init`);
        await addFileToRepo(path, nameOfFileToCommit, { stage: true, commit: true });
    }
    else {
        execSync(`git -C ${path} init --bare`);
    }
    return path;
};
const createBareRepo = createRepo;

/**
 * Copy folder recursively
 *
 * @private
 * @param {string} src
 * @param {string} dest
 * @returns {Promise}
 */
async function copyFolder(src, dest) {
    await fs.promises.mkdir(dest, { recursive: true });

    const entries = await fs.promises.readdir(src, { withFileTypes: true });

    for(const entry of entries) {
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);

        entry.isDirectory() ?
            await copyFolder(srcPath, destPath) :
            await fs.promises.copyFile(srcPath, destPath);
    }
}

/**
 * Replicates a repository
 *
 * @param {string} repoPath
 * @returns {Promise<string>} path to new repo
 */
const duplicateRepo = async (repoPath) => {
    const newPath = createTempFolder();
    await copyFolder(repoPath, newPath);
    return newPath;
};

/**
 * Adds remote from src to target repo
 *
 * @param {string} srcRepoPath
 * @param {string} targetRepoPath
 * @param {string} remoteName
 * @return {Promise}
 */
const addRemote = (srcRepoPath, targetRepoPath, remoteName = 'origin') => {
    return git(srcRepoPath).remote(remoteName, targetRepoPath);
};

/**
 * adds a file to a git repository
 *
 * @param {string} repoPath
 * @param {string} name
 * @param {object} options stage: boolean, commit: boolean
 * @returns {Promise<void>} options stage: boolean, commit: boolean
 */
const addFileToRepo = async (repoPath, name, options = { stage: false, commit: false }) => {
    const repo = git(repoPath);
    if(options.branch) {
        await repo.checkout(options.branch, { '-q': true, 'b': true });
    }
    await fs.promises.writeFile(join(repoPath, name), '');
    if(options.stage) {
        await repo.add(name);
        if(options.commit) {
            await repo.commit(`Added ${name}`);
        }
    }
};

/**
 * Check if repo has untracked or uncommitted changes
 *
 * @param {string} repoPath to repository
 * @returns {Promise<Boolean>}
 */
const isDirty = async (repoPath) => {
    const status = await git(repoPath).status();
    const clean = status.isClean();
    const untracked = status.not_added.length > 0;
    return !clean || untracked;
};

/**
 * Retrieve current branch
 *
 * @param {string} repoPath
 * @returns {Promise<string>} branch name
 */
const currentBranch = async (repoPath) => {
    try {
        const { current } = await git(repoPath).branch();
        return current || 'HEAD';
    }
    catch (err) {
        return Promise.reject(err);
    }
};

/**
 * Push local to remote
 *
 * @param {string} repoPath
 * @param {string} remote
 * @param {string} branch
 * @returns {Promise<string>} branch
 */
const push = (repoPath, remote = 'origin', branch = 'all') => {
    if(branch === 'all') {
        return git(repoPath).push(remote, { '--all':true, '-q': true });
    }

    return git(repoPath).push(remote, branch, { '-u':true, '-q': true });
};

/**
 * Pull from remote
 *
 * @param {string} repoPath
 * @param {string} remote
 * @param {string} branch
 * @returns {Promise<string>}
 */
const pull = (repoPath, remote = 'origin', branch = 'master') => {
    return git(repoPath).pull(remote, branch, { '-q': true });
};

/**
 * Fetch remotes quietly
 *
 * @param {string} repoPath
 */
const fetchRemotes = (repoPath) => {
    return git(repoPath).fetch({ '--quiet': true, '--all': true });
};

/**
 * Create new local commit
 *
 * @param {string} repoPath
 * @param {string | null} fileName - optional file name
 * @param {string} branch - optional
 * @returns {Promise<string>} log subject
 */
const addCommit = async (repoPath, fileName, branch) => {
    const repo = git(repoPath);

    if(branch) {
        // create a new branch with simple-git
        await repo.branch([ branch, 'HEAD' ]);
        await repo.checkout(branch, { '-q': true });
    }

    const _name = fileName || randomize('Aa0', commitLength);
    await fs.promises.writeFile(join(repoPath, _name), '');

    const result = await repo.add(_name).commit(`${_name}`)
        .log();
    return result.latest.message;
};

/**
 * Create new local commit with message
 *
 * @param {string} repoPath
 * @param {string} message
 * @param {string} branch - optional
 * @returns {Promise<string>} log subject
 */
const addCommitWithMessage = async (repoPath, message, branch) => {
    const repo = git(repoPath);
    const _name = randomize('Aa0', commitLength);
    await fs.promises.writeFile(join(repoPath, _name), '');
    if(branch) {
        await repo.checkout(branch, { '-q': true, 'b': true });
    }

    return repo.add(_name).commit(`${message}`)
        .log().latest.message;
};

/**
 * Delete file from repository
 *
 * @param {string} repoPath
 * @param {string} name
 * @returns {Promise<string>} name
 */
const deleteFile = (repoPath, name) => {
    return git(repoPath).rm(name)
        .add(name)
        .commit(`delete ${name}`);
};

/**
 * Returns branch log
 *
 * @param {string} repoPath
 * @param {string} branch
 * @returns {Array}
 */
const log = (repoPath, branch = 'master') => {
    git(repoPath).log();
    return execSync(`git -C ${repoPath} log --format="%s" ${branch}`, { encoding: 'utf8' }).split('\n');
};

module.exports = {
    addCommit
    , addCommitWithMessage
    , addFileToRepo
    , addRemote
    , createBareRepo
    , createRepo
    , currentBranch
    , deleteFile
    , duplicateRepo
    , fetchRemotes
    , isDirty
    , log
    , push
    , pull
};
