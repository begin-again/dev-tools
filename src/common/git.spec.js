
// git library module
// -- tests are slow due to an inability to mock git repositories

/* eslint no-magic-numbers:off */
/* eslint-env mocha */

const sinon = require('sinon');
const chai = require('chai');
chai.use(require('sinon-chai'));
const { expect } = chai;

const gtools = require('./git-tools');
const { initBase, destroy } = require('./temp');
const {
    currentBranch
    , currentHash
    , commitsDiff
    , commitDiffCounts
    , isDirty
    , hasCommits
    , headLog
    , gitFetch
} = require('./git');

const logger = {};

describe('git module - makes FS writes so is slow', function() {
    this.timeout(12000);
    before(initBase);
    after(destroy);
    describe('currentBranch()', () => {
        it('should be test branch', async () => {
            const repo = gtools.createRepo('afile');
            gtools.addCommit(repo, null, 'test');

            const result = await currentBranch(repo);

            expect(result).to.equal('test');
        });
        it('should be master branch', async () => {
            const repo = gtools.createRepo('afile');
            gtools.addCommit(repo);

            const result = await currentBranch(repo);

            expect(result).to.equal('master');
        });
        it('should be HEAD if no commit', async () => {
            const repo = gtools.createBareRepo();

            const result = await currentBranch(repo);

            expect(result).to.equal('HEAD');
        });
    });
    describe('currentHash()', () => {
        it('should be valid head commit hash', async () => {
            const repo = gtools.createRepo('afile');
            gtools.addCommit(repo);

            const result = await currentHash(repo);

            expect(result).not.to.be.empty;
            expect(result).to.match(/^[a-f0-9]{40}$/g);
        });
    });
    describe('isDirty', () => {
        it('should be true', async () => {
            const repo = gtools.createRepo('afile');
            gtools.addFileToRepo(repo, 'bfile');

            const result = await isDirty(repo);

            expect(result).to.be.true;
        });
        it('should be false', async () => {
            const repo = gtools.createRepo('afile');
            gtools.addFileToRepo(repo, 'bfile', { stage: true, commit: true });

            const result = await isDirty(repo);

            expect(result).to.be.false;
        });
    });
    describe('hasCommits()', () => {
        it('should not have error property when commits present', async () => {
            const repo = gtools.createRepo('afile');

            const { error } = await hasCommits(repo);

            expect(error).to.be.undefined;
        });
        it('should have error property when not commits present', async () => {
            const repo = gtools.createBareRepo();

            const { error } = await hasCommits(repo);

            expect(error).to.equal(1);
        });
    });
    describe('sequential tests', () => {
        this.timeout(14000);
        // must run in sequence due to shared repositories
        let origin; let local1; let local2;
        before(() => {
            origin = gtools.createBareRepo();
            local1 = gtools.createRepo('afile');
            gtools.addRemote(local1, origin);
            gtools.push(local1);
            local2 = gtools.duplicateRepo(local1);
            gtools.addCommit(local2);
            gtools.addCommitWithMessage(local2, 'hello, world');
            gtools.push(local2);
            gtools.fetchRemotes(local1);
        });
        describe('commitsDiff()', () => {
            it('should be zero ahead', async () => {
                const ahead = await commitsDiff(local1);

                expect(ahead).equals(0);
            });
            it('should be 2 in total', async () => {
                const total = await commitsDiff(local1, 'master', true);

                expect(total).equals(2);
            });
        });
        describe('commitDiffCounts()', () => {
            it('should not have error', async () => {
                const { ahead, behind, error } = await commitDiffCounts(local1);

                expect(ahead).equals(0);
                expect(behind).equals(2);
                expect(error).to.be.undefined;
            });
            it('should have error', async () => {
                const { error } = await commitDiffCounts('');

                expect(error).not.to.be.undefined;
            });
        });
        describe('headLog()', () => {
            it('should be \'hello, world\'', async () => {
                const hello = 'hello, world\n\n';
                logger.error = sinon.spy();
                const result = await headLog(local2, logger);

                expect(result).equals(hello.trim());
            });
        });
        describe('getFetch()', () => {
            it('should not throw error', (done) => {
                const local3 = gtools.duplicateRepo(local1);

                const wrapper = async () => {
                    await gitFetch(local3);
                };

                expect(wrapper).not.to.throw();
                done();
            });
            it('should retrieve commits', async () => {
                const local4 = gtools.duplicateRepo(local2);
                const beforeFetch = gtools.log(local4, 'origin/master');
                expect(beforeFetch.length).equals(4);

                gtools.addCommitWithMessage(local2, 'new commit');
                gtools.push(local2);
                await gitFetch(local4);

                const afterFetch = gtools.log(local4, 'origin/master');
                expect(afterFetch.length).equals(5);
            });
        });
    });
});
