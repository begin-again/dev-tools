const git = require('simple-git');
// eslint-disable-next-line no-unused-vars
const { SimpleGitBase, Response } = require('simple-git');
const randomize = require('randomatic');
const { writeFileSync } = require('fs');
const { join } = require('path');
const commitLength = 20;

class GitTool {
    /**
     * @param {string} repoPath
     * @param {boolean} [isBare] create bare repo
     */
    constructor(repoPath) {
        this.repoPath = repoPath;
        /** @type {SimpleGitBase} */
        this._self = git(repoPath);
    }

    init(isBare = true) {
        this.self.init(isBare);
    }

    /**
     * Pull from remote
     * @param {string} [remote]
     * @param {string} [branch]
     * @returns {Promise}
     */
    pull(remote = 'origin', branch = 'master') {
        return this._self.pull(remote, branch, { '-q': true });
    }

    /**
     * Fetch all remotes
     * @returns {Promise}
     */
    fetch() {
        return this._self.fetch({ '--quiet': true, '--all': true });
    }

    /**
     * push to remote
     * @param {string} [remote]
     * @param {string} [branch]
     * @returns {Promise}
     */
    push(remote = 'origin', branch = 'all') {
        if(branch === 'all') {
            return this._self.push(remote, { '--all': true, '-q': true });
        }

        return this._self.push(remote, branch, { '-u': true, '-q': true });
    }

    /**
     * Commit an empty file
     * @param {string} [fileName]
     * @param {string} [branch]
     * @param {string} [message]
     * @returns {Promise}
     */
    async addCommit(fileName, branch, message) {
        const _name = fileName || randomize('Aa0', commitLength);
        writeFileSync(join(this.repoPath, _name), '');
        if(branch) {
            await this.self.checkout(branch, { '-q': true, 'b': true });
        }

        return this._self.add(_name)
            .commit(`${message || _name}`)
            .log()
            .latest.message;
    }

    /**
     * add remote
     * @param {string} targetRepoPath
     * @param {string} [remoteName]
     * @returns {Promise}
     */
    addRemote(targetRepoPath, remoteName = 'origin') {
        return this._self.remote(remoteName, targetRepoPath);
    }

    /**
     * add empty file
     * @param {string} name
     * @param {object} options
     * @param {boolean} options.[stage] false
     * @param {boolean} options.[commit] false
     * @param {string} options.[branch] undefined
     * @returns {Promise<void>}
     */
    async addFile(name, options = { stage: false, commit: false }) {
        const { branch, commit, stage } = options;
        writeFileSync(join(this.repoPath, name), '');
        if(branch) {
            await this._self.checkout(branch, { '-q': true, 'b': true });
        }
        if(stage) {
            await this._self.add(name);
            if(commit) {
                this._self.commit(`Added ${name}`);
            }
        }
    }

    /**
     * uncommitted changes including untracked files
     * @returns {Promise<boolean>}
     */
    async isDirty() {
        const status = await this._self.status();
        const clean = status.isClean();
        const untracked = status.not_added.length > 0;
        return !clean || untracked;
    }

    /**
     *
     * @returns {Promise<string>} branch name
     */
    async currentBranch() {
        try {
            const { current } = await this._self.branch();
            return current || 'HEAD';
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
}

module.exports = GitTool;
