/* eslint-disable no-magic-numbers */

const sinon = require('sinon');
const chai = require('chai');
chai.use(require('sinon-chai'));
const { expect } = chai;

const gtools = require('../src/common/git-tools');
const { initBase, destroy } = require('../src/common/temp');
const {
    commitsDiff
    , commitDiffCounts
    , headLog
} = require('../src/common/git');

const logger = {};

describe.skip('Git module - sequential tests', function() {
    before(initBase);
    after(destroy);
    describe('run', function() {
        this.timeout(14000);
        // must run in sequence due to shared repositories
        let origin; let local1; let local2;
        before(async function() {
            try {
                origin = await gtools.createBareRepo();
                local1 = await gtools.createRepo('afile');
                await gtools.addRemote(local1, origin);
                await gtools.push(local1);
                local2 = await gtools.duplicateRepo(local1);
                await gtools.addCommit(local2);
                await gtools.addCommitWithMessage(local2, 'hello, world');
                await gtools.push(local2);
                await gtools.fetchRemotes(local1);
            }
            catch (err) {
                console.error(err);
                expect.fail();
            }
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
    });
});