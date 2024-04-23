
// git library module
// -- tests are slow due to an inability to mock git repositories

/* eslint no-magic-numbers:off */
/* eslint-env mocha */

import sinon from 'sinon';
import { expect } from 'chai';

import Temp from '../src/common/temp-class.mjs';
import {
    addCommit,
    addCommitWithMessage,
    addFileToRepo, addRemote,
    createBareRepo,
    createRepo,
    duplicateRepo,
    fetchRemotes,
    log,
    push,
} from '../src/common/git-tools.mjs';
import {
    commitDiffCounts,
    commitsDiff,
    currentBranch,
    currentHash,
    gitFetch,
    hasCommits,
    headLog,
    isDirty,
} from '../src/common/git.mjs';

const logger = {};

describe('git module - makes FS writes so is slow', function() {
    let tmp;
    before(() => {
        tmp = new Temp();
    });
    after(() => {
        tmp.destroy();
    });
    this.timeout(12000);
    describe('currentBranch()', function() {
        it('should be test branch', async function() {
            const repo = await createRepo(tmp, 'foo');
            await addCommit(repo, null, 'test');

            const result = await currentBranch(repo);

            expect(result).to.equal('test');
        });
        it('should be master branch', async function() {
            const repo = await createRepo(tmp, 'foo');
            await addCommit(repo);

            const result = await currentBranch(repo);

            expect(result).to.equal('master');
        });
        it('should be HEAD if no commit', async function() {
            const repo = await createBareRepo(tmp);

            const result = await currentBranch(repo);

            expect(result).to.equal('HEAD');
        });
    });
    describe('currentHash()', function() {
        it('should be valid head commit hash', async function() {
            const repo = await createRepo(tmp, 'foo');
            await addCommit(repo);

            const result = await currentHash(repo);

            expect(result).not.to.be.empty;
            expect(result).to.match(/^[a-f0-9]{40}$/g);
        });
    });
    describe('isDirty', function() {
        it('should be true', async function() {
            const repo = await createRepo(tmp, 'foo');
            await addFileToRepo(repo, 'bar');

            const result = await isDirty(repo);

            expect(result).to.be.true;
        });
        it('should be false', async function() {
            const repo = await createRepo(tmp, 'foo');
            await addFileToRepo(repo, 'bar', { stage: true, commit: true });

            const result = await isDirty(repo);

            expect(result).to.be.false;
        });
    });
    describe('hasCommits()', function() {
        it('should not have error property when commits present', async function() {
            const repo = await createRepo(tmp, 'foo');

            const { error } = await hasCommits(repo);

            expect(error).to.be.undefined;
        });
        it('should have error property when not commits present', async function() {
            const repo = await createBareRepo(tmp);

            const { error } = await hasCommits(repo);

            expect(error).to.equal(1);
        });
    });
    describe('sequential tests', function() {
        this.timeout(14000);
        // must run in sequence due to shared repositories
        let origin; let local1; let local2;
        before(async function() {
            origin = await createBareRepo(tmp);
            local1 = await createRepo(tmp, 'foo');
            await addRemote(local1, origin);
            await push(local1);
            local2 = await duplicateRepo(local1, tmp);
            await addCommit(local2);
            await addCommitWithMessage(local2, 'hello, world');
            await push(local2);
            await fetchRemotes(local1);
        });
        describe('commitsDiff()', function() {
            it('should be zero ahead', async function() {
                const ahead = await commitsDiff(local1);

                expect(ahead).equals(0);
            });
            it('should be 2 in total', async function() {
                const total = await commitsDiff(local1, 'master', true);

                expect(total).equals(2);
            });
        });
        describe('commitDiffCounts()', function() {
            it('should not have error', async function() {
                const { ahead, behind, error } = await commitDiffCounts(local1);

                expect(ahead).equals(0);
                expect(behind).equals(2);
                expect(error).to.be.undefined;
            });
            it('should have error', async function() {
                const { error } = await commitDiffCounts('');

                expect(error).not.to.be.undefined;
            });
        });
        describe('headLog()', function() {
            it('should be \'hello, world\'', async function() {
                const hello = 'hello, world\n\n';
                logger.error = sinon.spy();
                const result = await headLog(local2, logger);

                expect(result).equals(hello.trim());
            });
        });
        describe('getFetch()', function() {
            it('should not throw error', async (done) => {
                const local3 = await duplicateRepo(local1, tmp);

                const wrapper = async function() {
                    await gitFetch(local3);
                };

                expect(wrapper).not.to.throw();
                done();
            });
            it('should retrieve commits', async function() {
                const local4 = await duplicateRepo(local2, tmp);
                const beforeFetch = log(local4, 'origin/master');
                expect(beforeFetch.length).equals(4);

                await addCommitWithMessage(local2, 'new commit');
                await push(local2);
                await gitFetch(local4);

                const afterFetch = log(local4, 'origin/master');
                expect(afterFetch.length).equals(5);
            });
        });
    });
});
