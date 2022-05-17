/**
 * @module Git-Tools
 */
const { execSync } = require('child_process');
const { writeFileSync, mkdirSync, readdirSync, lstatSync, copyFileSync, existsSync } = require('fs');
const { join } = require('path');
const randomize = require('randomatic');
const { createTempFolder } = require('./temp');

const commitLength = 20;

/**
 * initializes and empty git repository
 * into a temp folder within the base temp folder
 *
 * @param {String} nameOfFileToCommit - name
 */
const createRepo = (nameOfFileToCommit = '') => {
    const path = createTempFolder();
    if(nameOfFileToCommit) {
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
 */
const addRemote = (srcRepoPath, targetRepoPath, remoteName = 'origin') => {
    const cmd = `git -C ${srcRepoPath} remote add ${remoteName} ${targetRepoPath}`;
    execSync(cmd);
};

/**
 * adds a file to a git repository
 *
 * @param {String} repoPath
 * @param {String} name
 * @param {object} options stage: boolean, commit: boolean
 */
const addFileToRepo = (repoPath, name, options = { stage: false, commit: false }) => {
    if(options.branch) {
        execSync(`git -C ${repoPath} checkout -qb ${options.branch}`);
    }
    writeFileSync(join(repoPath, name), '');
    if(options.stage) {
        execSync(`git -C ${repoPath} add ${name}`);
        if(options.commit) {
            execSync(`git -C ${repoPath} commit -m "add ${name}"`);
        }
    }
};

/**
 * Check if repo has untracked or uncommitted changes
 *
 * @param {String} repoPath to repository
 * @returns {Boolean}
 */
const isDirty = (repoPath) => {
    const out = execSync(`git -C ${repoPath} status --porcelain`);
    return out.toString().length > 0;
};

/**
 * Retrieve current branch
 *
 * @param {String} repoPath
 * @returns {String}
 */
const currentBranch = (repoPath) => {
    return execSync(`git -C ${repoPath} rev-parse --abbrev-ref HEAD`, { encoding: 'utf8' }).trim();
};

/**
 * Push local to remote
 *
 * @param {String} repoPath
 * @param {String} remote
 * @param {String} branch
 */
const push = (repoPath, remote = 'origin', branch = 'all') => {
    if(branch === 'all') {
        return execSync(`git -C ${repoPath} push -q ${remote} --all`);
    }
    return execSync(`git -C ${repoPath} push -qu ${remote} ${branch}`);
};

/**
 * Pull from remote
 *
 * @param {String} repoPath
 * @param {String} remote
 * @param {String} branch
 */
const pull = (repoPath, remote = 'origin', branch = 'master') => {
    return execSync(`git -C ${repoPath} pull -q ${remote} ${branch}`);
};

/**
 * Fetch remotes quietly
 *
 * @param {String} repoPath
 */
const fetchRemotes = (repoPath) => {
    return execSync(`git -C ${repoPath} fetch -q --all`);
};

/**
 * Create new local commit
 *
 * @param {String} repoPath
 * @param {String | null} fileName - optional file name
 * @param {String} branch - optional
 */
const addCommit = (repoPath, fileName, branch) => {
    const _name = fileName || randomize('Aa0', commitLength);
    writeFileSync(join(repoPath, _name), '');
    if(branch) {
        execSync(`git -C ${repoPath} branch ${branch} master && git -C ${repoPath} checkout -q ${branch}`);
    }
    execSync(`git -C ${repoPath} add "${_name}" && git -C ${repoPath} commit -m "${_name}"`);
    return execSync(`git -C ${repoPath} log -1 -q --format="%h %s %cd"`, { encoding: 'utf-8' }).trim();
};

/**
 * Create new local commit with message
 *
 * @param {String} repoPath
 * @param {String} message
 * @param {String} branch - optional
 */
const addCommitWithMessage = (repoPath, message, branch) => {
    const fileName = randomize('Aa0', commitLength);
    writeFileSync(join(repoPath, fileName), '');
    if(branch) {
        execSync(`git -C ${repoPath} branch ${branch} master && git -C ${repoPath} checkout -q ${branch}`);
    }
    execSync(`git -C ${repoPath} add ${fileName} && git -C ${repoPath} commit -m "${message}"`);
    return execSync(`git -C ${repoPath} log -1 -q --format="%h %s %cd"`, { encoding: 'utf-8' }).trim();
};

/**
 * Delete file from repository
 *
 * @param {String} repoPath
 * @param {String} name
 */
const deleteFile = (repoPath, name) => {
    execSync(`git -C ${repoPath} rm ${name} && git -C ${repoPath} commit -am "delete ${name}"`);
};

/**
 * Returns branch log
 *
 * @param {String} repoPath
 * @param {String} branch
 * @returns {Array}
 */
const log = (repoPath, branch = 'master') => {
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
