
import mockFS from 'mock-fs';
import fs from 'node:fs';
import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai-es';
chai.use(sinonChai);
import { DateTime } from 'luxon';
import { removeTarget, folderList, removeSonarTemp } from '../src/clean/clean.js';


const logger = console;

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
