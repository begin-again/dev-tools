/* eslint-disable no-magic-numbers */
const chai = require('chai');
const { expect } = chai;
const sinon = require('sinon');
chai.use(require('sinon-chai'));

const fs = require('fs');
const mockFS = require('mock-fs');
const logger = console;

const { removeTarget, folderList } = require('./clean');


const fake = {
    'abc': {}
    , 'xyz':''
    , '123': {}
    , '456': ''
};

describe('Cleaner Module', () => {
    describe('folderList()', () => {
        it('should be an array of folders', () => {
            mockFS(fake);

            const result = folderList(/.*/, '.');

            expect(result).an('array').with.lengthOf(2);
            mockFS.restore();
        });
        it('should be an empty array', () => {
            mockFS(fake);

            const result = folderList(/bogus/, '.');

            expect(result).an('array').with.lengthOf(0);
        });
    });
    describe('removeTarget()', () => {
        beforeEach(() => {
            logger.warn = sinon.spy();
            logger.info = sinon.spy();
            logger.debug = sinon.spy();
        });
        it('should remove 1 folder and log', async () => {
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
        it('should log warning when no matching folders found', async () => {
            mockFS({});

            await removeTarget('Fake', /^xyz$/m, '.');

            expect(logger.warn).to.calledOnceWith(`no suitable folders found`);
            mockFS.restore();
        });
    });
});
