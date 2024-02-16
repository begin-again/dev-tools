const chai = require('chai');
const { expect } = chai;

const mockFS = require('mock-fs');
const { dirname } = require('path');
const fs = require('fs');

const options = {};
const TF = require('../src/common/temp');

const oldBase = TF.baseFolder;
describe('Temp Folder utility', () => {
    beforeEach(() => {
        mockFS({});
        delete TF.baseFolder;
        options.tempFolder = '';
    });
    afterEach(mockFS.restore);
    after(() => {
        TF.baseFolder = oldBase;
    });
    describe('initBase()', () => {
        it('should not throw', () => {
            expect(TF.baseFolder).to.be.undefined;
            expect(TF.initBase).not.to.throw();
            expect(TF.baseFolder).not.to.be.undefined;
        });
        it('should set base to system temp', () => {
            expect(TF.baseFolder).to.be.undefined;

            const result = TF.initBase();

            expect(fs.statSync(result).isDirectory()).to.be.true;

            const subs = fs.readdirSync(result);
            expect(subs.length).to.equal(0);

            expect(TF.baseFolder).not.to.be.undefined;
        });
        it('should not set base more than onece', () => {
            expect(TF.baseFolder).to.be.undefined;

            const first = TF.initBase();
            const second = TF.initBase();

            expect(second).to.equal(first);
        });
    });
    describe('createTempFolder()', () => {
        it('should create new folder within base path', () => {
            expect(TF.baseFolder).to.be.undefined;

            const base = TF.initBase();
            const result = TF.createTempFolder();

            expect(fs.statSync(result).isDirectory()).to.be.true;
            expect(dirname(result)).to.equal(base);

        });
        it('should throw error', () => {
            expect(TF.createTempFolder).to.throw('base folder not defined');
        });
    });
    describe('destroy()', () => {
        it('should remove system base', () => {
            mockFS({ 'folly': {} });
            TF.baseFolder = './folly';
            let subs = fs.readdirSync('.');
            expect(subs).to.contain('folly');

            TF.destroy();
            subs = fs.readdirSync('.');

            expect(subs).not.to.contain('folly');
            expect(TF.baseFolder).to.be.undefined;
        });
    });
});
