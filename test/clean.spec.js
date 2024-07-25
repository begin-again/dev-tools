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
    '.sonarlinttmp_1': {}
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
            mockFS({
                'folder1': {}
                , 'file1':''
                , 'folder2': {}
                , 'file2': ''
            });
            let list = fs.readdirSync('.');
            expect(list).includes('folder1');
            expect(list).includes('folder2');
            expect(list).includes('file1');
            expect(list).includes('file2');

            await removeTarget('Fake', /^folder2$/m, '.');
            list = fs.readdirSync('.');

            expect(list).includes('folder1');
            expect(list).not.includes('folder2');
            expect(list).includes('file1');
            expect(list).includes('file2');

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
        const logStub = { debug: sinon.stub(), info: sinon.stub(), error: sinon.stub() };
        const rootPath = '.';
        const now = DateTime.now();

        it('should remove no folders', async function() {
            mockFS({
                'sonarlinttmp_1': mockFS.directory({
                    // @ts-ignore
                    ctime: now.minus({ day: 1 }).startOf('day')
                })
                , 'sonarlinttmp_2': mockFS.directory({
                    // @ts-ignore
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
                'sonarlinttmp_1': mockFS.directory({
                    // @ts-ignore
                    ctime: now.minus({ day: 1 }).startOf('day')
                })
                , 'xodus-local-only': mockFS.directory({
                    // @ts-ignore
                    ctime: now.minus({ day: 2 }).startOf('day')
                })
            });

            const result = await removeSonarTemp({ root: rootPath, age: 2 }, logStub);

            const folders = fs.readdirSync(rootPath, { withFileTypes: true }).filter(d => d.isDirectory());

            expect(result).equal(folders.length);
        });
    });
});
