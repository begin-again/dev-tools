import chai from 'chai';
const { expect } = chai;
import mockFS from 'mock-fs';
import { dirname } from 'node:path';
import fs from 'node:fs';
import * as TF from '../src/common/temp.mjs';

const options = {};
const oldBase = TF.baseFolder;
describe('Temp Folder utility', () => {
    beforeEach(() => {
        mockFS({});
        TF.state.baseFolder = '';
        options.tempFolder = '';
    });
    afterEach(mockFS.restore);
    after(() => {
        TF.state.baseFolder = oldBase;
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
        it('should not set base more than once', () => {
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
            TF.state.baseFolder = './folly';
            let subs = fs.readdirSync('.');
            expect(subs).to.contain('folly');

            TF.destroy();
            subs = fs.readdirSync('.');

            expect(subs).not.to.contain('folly');
            expect(TF.state.baseFolder).to.be.empty;
        });
    });
});
