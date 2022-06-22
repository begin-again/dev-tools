/**
 * @module Git-Tools
 */
const { execSync } = require('child_process');
const { writeFileSync, mkdirSync, readdirSync, lstatSync, copyFileSync, existsSync } = require('fs');
const { join } = require('path');
const randomize = require('randomatic');
const { createTempFolder } = require('./temp');
const git = require('simple-git');

const commitLength = 20;

/**
 * initializes and empty git repository
 * into a temp folder within the base temp folder
 *
 * @param {String} nameOfFileToCommit - name
 */
const createRepo = async (nameOfFileToCommit = '') => {
    const path = createTempFolder();
    if(nameOfFileToCommit) {
        await git(path).init();
        execSync(`git -C ${path} init`);
        addFileToRepo(path, nameOfFileToCommit, { stage: true, commit: true });
    }
    else {
        execSync(`git -C ${path} init --bare`);
    }
    return path;
};
const createBareRepo = createRepo;

// mkdirSync, readdirSync, lstatSync, copyFileSync
/**
 * Copy folder recursively
 *
 * @private
 * @param {String} src
 * @param {String} dest
 */
const copyFolder = (src, dest) => {
    if(!existsSync(dest)) {
        mkdirSync(dest);
    }
    readdirSync(src).map(file => {
        if(lstatSync(join(src, file)).isFile()) {
            copyFileSync(join(src, file), join(dest, file));
        }
        else {
            copyFolder(join(src, file), join(dest, file));
        }
    });
};

/**
 * Replicates a repository
 *
 * @param {String} repoPath
 * @returns {String} path to new repo
 */
const duplicateRepo = (repoPath) => {
    const newPath = createTempFolder();
    copyFolder(repoPath, newPath);
    return newPath;
};

/**
 * Adds remote from src to target repo
 *
 * @param {String} srcRepoPath
 * @param {String} targetRepoPath
 * @param {String} remoteName
 * @return {Promise}
 */
const addRemote = (srcRepoPath, targetRepoPath, remoteName = 'origin') => {
    return git(srcRepoPath).remote(remoteName, targetRepoPath);
};

/**
 * adds a file to a git repository
 *
 * @param {String} repoPath
 * @param {String} name
 * @param {object} options stage: boolean, commit: boolean
 * @returns {Promise<void>} options stage: boolean, commit: boolean
 */
const addFileToRepo = async (repoPath, name, options = { stage: false, commit: false }) => {
    const repo = git(repoPath);
    if(options.branch) {
        await repo.checkout(options.branch, { '-q': true, 'b': true });
    }
    writeFileSync(join(repoPath, name), '');
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
 * @param {String} repoPath to repository
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
 * @param {String} repoPath
 * @returns {Promise<String>} branch name
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
 * @param {String} repoPath
 * @param {String} remote
 * @param {String} branch
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
 * @param {String} repoPath
 * @param {String} remote
 * @param {String} branch
 * @returns {Promise<String>}
 */
const pull = (repoPath, remote = 'origin', branch = 'master') => {
    return git(repoPath).pull(remote, branch, { '-q': true });
};

/**
 * Fetch remotes quietly
 *
 * @param {String} repoPath
 */
const fetchRemotes = (repoPath) => {
    return git(repoPath).fetch({ '--quiet': true, '--all': true });
};

/**
 * Create new local commit
 *
 * @param {String} repoPath
 * @param {String | null} fileName - optional file name
 * @param {String} branch - optional
 * @returns {Promise<String>} log subject
 */
const addCommit = async (repoPath, fileName, branch) => {
    const repo = git(repoPath);
    const _name = fileName || randomize('Aa0', commitLength);
    writeFileSync(join(repoPath, _name), '');
    if(branch) {
        await repo.checkout(branch, { '-q': true, 'b': true });
        // execSync(`git -C ${repoPath} branch ${branch} master && git -C ${repoPath} checkout -q ${branch}`);
    }

    return repo.add(_name).commit(`${_name}`)
        .log().latest.message;
    // execSync(`git -C ${repoPath} add "${_name}" && git -C ${repoPath} commit -m "${_name}"`);
    // return execSync(`git -C ${repoPath} log -1 -q --format="%h %s %cd"`, { encoding: 'utf-8' }).trim();
};

/**
 * Create new local commit with message
 *
 * @param {String} repoPath
 * @param {String} message
 * @param {String} branch - optional
 * @returns {Promise<String>} log subject
 */
const addCommitWithMessage = async (repoPath, message, branch) => {
    const repo = git(repoPath);
    const _name = randomize('Aa0', commitLength);
    writeFileSync(join(repoPath, _name), '');
    if(branch) {
        await repo.checkout(branch, { '-q': true, 'b': true });
    }

    return repo.add(_name).commit(`${message}`)
        .log().latest.message;
};

/**
 * Delete file from repository
 *
 * @param {String} repoPath
 * @param {String} name
 * @returns {Promise<String>} name
 */
const deleteFile = (repoPath, name) => {
    return git(repoPath).rm(name)
        .add(name)
        .commit(`delete ${name}`);
    // execSync(`git -C ${repoPath} rm ${name} && git -C ${repoPath} commit -am "delete ${name}"`);
};

/**
 * Returns branch log
 *
 * @param {String} repoPath
 * @param {String} branch
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
