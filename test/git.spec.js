
// git library module
// -- tests are slow due to an inability to mock git repositories

/* eslint no-magic-numbers:off */
/* eslint-env mocha */

const chai = require('chai');
chai.use(require('sinon-chai'));
const { expect } = chai;

const gtools = require('../src/common/git-tools');
const { initBase, destroy } = require('../src/common/temp');
const {
    currentBranch
    , currentHash
    , isDirty
    , hasCommits
} = require('../src/common/git');

// how might I check if the the git config user.name and user.email are configured?
async function checkGitConfig() {
    const git = gtools.git.simpleGit();

    try {
        let userName = await git.raw([ 'config', 'user.name' ]);
        let userEmail = await git.raw([ 'config', 'user.email' ]);

        if(!userName) {
            userName = 'Jim Dandy';
            await git.raw([ 'config', '--global', 'user.name', userName ]);
        }
        if(!userEmail) {
            userEmail = 'jim@example.com';
            // set global config
            await git.raw([ 'config', '--global', 'user.email', userEmail ]);
        }
    }
    catch {
        // handle error
        console.error('Failed to check git config');
    }
}


describe('git module - non-sequential', function() {

    this.timeout(12000);
    before(async() => {
        initBase();
        await checkGitConfig();
    });
    after(destroy);
    describe('currentBranch()', function() {
        it('should be test branch', async function() {
            const repo = await gtools.createRepo('afile');
            await gtools.addCommit(repo, null, 'test');

            const result = await currentBranch(repo);

            expect(result).to.equal('test');
        });
        it('should be the default branch', async function() {
            const repo = await gtools.createRepo('afile');
            await gtools.addCommit(repo);

            const result = await currentBranch(repo);

            // determine default branch

            const br = await gtools.git.simpleGit(repo).revparse([ '--abbrev-ref', 'HEAD' ]);
            expect(result).to.equal(br);
        });
        it('should be HEAD if no commit', async function() {
            const repo = await gtools.createBareRepo();

            const result = await currentBranch(repo);

            expect(result).to.equal('HEAD');
        });
    });
    describe('currentHash()', function() {
        it('should be valid head commit hash', async function() {
            const repo = await gtools.createRepo('afile');
            await gtools.addCommit(repo);

            const result = await currentHash(repo);

            expect(result).not.to.be.empty;
            expect(result).to.match(/^[a-f0-9]{40}$/g);
        });
    });
    describe('isDirty', function() {
        it('should be true', async function() {
            const repo = await gtools.createRepo('afile');
            await gtools.addFileToRepo(repo, 'bfile');

            const result = await isDirty(repo);

            expect(result).to.be.true;
        });
        it('should be false', async function() {
            const repo = await gtools.createRepo('afile');
            await gtools.addFileToRepo(repo, 'bfile', { stage: true, commit: true });

            const result = await isDirty(repo);

            expect(result).to.be.false;
        });
    });
    describe('hasCommits()', function() {
        it('should not have error property when commits present', async function() {
            const repo = await gtools.createRepo('afile');

            const { error } = await hasCommits(repo);

            expect(error).to.be.undefined;
        });
        it('should have error property when not commits present', async function() {
            const repo = await gtools.createBareRepo();

            const { error } = await hasCommits(repo);

            expect(error).to.equal(1);
        });
    });
});
