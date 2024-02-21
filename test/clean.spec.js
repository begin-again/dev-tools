/* eslint-disable no-magic-numbers */
const chai = require('chai');
const { expect } = chai;
const sinon = require('sinon');
chai.use(require('sinon-chai'));

const fs = require('node:fs');
const mockFS = require('mock-fs');
const logger = console;
const { DateTime } = require('luxon');

const { removeTarget, folderList, removeSonarTemp } = require('../src/clean/clean.js');


const fake = {
    'abc': {}
    , 'xyz':''
    , '123': {}
    , '456': ''
};

describe('Cleaner Module', () => {
    describe('folderList()', function() {
        it('should be an array of folders', async function() {
            mockFS(fake);

            const result = await folderList(/.*/, '.');

            expect(result).an('array').with.lengthOf(2);
            mockFS.restore();
        });
        it('should be an empty array', async function() {
            mockFS(fake);

            const result = await folderList(/bogus/, '.');

            expect(result).an('array').with.lengthOf(0);
        });
    });
    describe('removeTarget()', function() {
        beforeEach(() => {
            logger.warn = sinon.spy();
            logger.info = sinon.spy();
            logger.debug = sinon.spy();
        });
        it('should remove 1 folder and log', async function() {
            mockFS(fake);
            let list = fs.readdirSync('.');
            expect(list).includes('abc');
            expect(list).includes('xyz');

            await removeTarget('Fake', /^abc$/m, '.');
            list = fs.readdirSync('.');

            expect(list).includes('xyz');
            expect(list).not.includes('abc');

            expect(logger.warn).calledOnceWith('attempting to delete 1 folders - please be patient');
            expect(logger.info).callCount(2);
            mockFS.restore();

        });
        it('should log warning when no matching folders found', async function() {
            mockFS({});

            await removeTarget('Fake', /^xyz$/m, '.');

            expect(logger.warn).to.calledOnceWith(`no suitable folders found`);
            mockFS.restore();
        });
    });
    describe('removeSonarTemp', function() {
        afterEach(mockFS.restore);
        const logStub = { debug: sinon.stub() };
        const rootPath = '.';
        const now = DateTime.now();

        it('should remove no folders', async function() {
            mockFS({
                folder1: mockFS.directory({
                    ctime: now.minus({ day: 1 }).startOf('day')
                })
                , folder2: mockFS.directory({
                    ctime: now.minus({ day: 2 }).startOf('day')
                })
            });

            const result = await removeSonarTemp({ root: rootPath, age: 3 }, logStub);

            const folders = fs.readdirSync(rootPath, { withFileTypes: true }).filter(d => d.isDirectory());


            expect(result).equal(0);
            expect(folders).to.have.lengthOf(2);

        });
        it('should remove 1 folders', async function() {
            mockFS({
                folder1: mockFS.directory({
                    ctime: now.minus({ day: 1 }).startOf('day')
                })
                , folder2: mockFS.directory({
                    ctime: now.minus({ day: 2 }).startOf('day')
                })
            });

            const result = await removeSonarTemp({ root: rootPath, age: 2 }, logStub);

            const folders = fs.readdirSync(rootPath, { withFileTypes: true }).filter(d => d.isDirectory());

            expect(result).equal(folders.length);
        });
    });
});
