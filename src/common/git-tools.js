/**
 * @module Git-Tools
 */
import fs from 'node:fs';
import { join } from 'node:path';
import randomize from 'randomatic';
import { simpleGit } from 'simple-git';

// eslint-disable-next-line no-unused-vars
import Temp from './temp.js';

const commitLength = 20;

/**
 * initializes and empty git repository
 * into a temp folder within the base temp folder
 *
 * @param {string} nameOfFileToCommit - name
 * @param {Temp} tmp - instance on Temp
 */
const createRepo = async (tmp, nameOfFileToCommit = '') => {
    const path = tmp.add();
    if(nameOfFileToCommit) {
        await simpleGit(path).init([ '--initial-branch=master' ]);
        await addFileToRepo(path, nameOfFileToCommit, { stage: true, commit: true });
    }
    else {
        await simpleGit(path).init(true);
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
 * @param {Temp} tmp
 * @returns {Promise<string>} path to new repo
 */
const duplicateRepo = async (repoPath, tmp) => {
    const newPath = tmp.add();
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
    return simpleGit(srcRepoPath).addRemote(remoteName, targetRepoPath);
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
    const repo = simpleGit(repoPath);
    if(options.branch) {
        await repo.checkoutLocalBranch(options.branch);
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
    const status = await simpleGit(repoPath).status();
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
        const { current } = await simpleGit(repoPath).branch();
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
 * @returns {Promise<*>} branch
 */
const push = (repoPath, remote = 'origin', branch = 'all') => {
    if(branch === 'all') {
        return simpleGit(repoPath).push(remote, '--all');
    }

    return simpleGit(repoPath).push(remote, branch, [ '-u', '-q' ]);
};

/**
 * Pull from remote
 *
 * @param {string} repoPath
 * @param {string} remote
 * @param {string} branch
 * @returns {Promise<*>}
 */
const pull = (repoPath, remote = 'origin', branch = 'master') => {
    return simpleGit(repoPath).pull(remote, branch, [ '-q' ]);
};

/**
 * Fetch remotes quietly
 *
 * @param {string} repoPath
 */
const fetchRemotes = (repoPath) => {
    return simpleGit(repoPath).fetch([ '--quiet', '--all' ]);
};

/**
 * Create new local commit
 *
 * @param {string} repoPath
 * @param {string | null} [fileName] - optional file name
 * @param {string} [branch] - optional
 * @returns {Promise<string>} log subject
 */
const addCommit = async (repoPath, fileName, branch) => {
    const repo = simpleGit(repoPath);

    if(branch) {
        // create a new branch with simple-git
        await repo.branch([ branch, 'HEAD' ]);
        await repo.checkout(branch, [ '-q' ]);
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
 * @param {string} [branch] - optional
 * @returns {Promise<string>} log subject
 */
const addCommitWithMessage = async (repoPath, message, branch) => {
    const repo = simpleGit(repoPath);
    const _name = randomize('Aa0', commitLength);
    await fs.promises.writeFile(join(repoPath, _name), '');
    if(branch) {
        await repo.checkout(branch, [ '-q', 'b' ]);
    }

    await repo.add(_name).commit(`${message}`);
    const log = await repo.log();
    return log.latest.message;
};

/**
 * Delete file from repository
 *
 * @param {string} repoPath
 * @param {string} name
 * @returns {Promise<*>} name
 */
const deleteFile = (repoPath, name) => {
    return simpleGit(repoPath).rm(name)
        .add(name)
        .commit(`delete ${name}`);
};

/**
 * Returns branch log
 *
 * @param {string} repoPath
 * @param {string} [branch]
 * @returns {Promise<object>}
 */
const log = (repoPath, branch = 'master') => {
    if(branch) {
        // @ts-ignore
        return simpleGit(repoPath).log(branch);
    }
    return simpleGit(repoPath).log();
};

export {
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
