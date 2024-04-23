import { dirname, basename } from 'node:path';
import mockFS from 'mock-fs';
import fs from 'node:fs';
import chai from 'chai';
const { expect } = chai;
import Temp from '../src/common/temp.mjs';


describe('Temp Folder utility', function() {
    beforeEach(function() {
        mockFS({});
    });
    afterEach(mockFS.restore);

    describe('constructor()', function() {
        it('should not throw', function() {
            let tf;
            try {
                tf = new Temp();
                expect(tf.baseFolder).not.to.be.undefined;
            }
            catch (err) {
                expect.fail(err.message);
            }
            finally {
                tf.destroy();
            }
        });
        it('should set baseName to input name', function() {
            let tf;
            try {
                tf = new Temp('abc');
                expect(basename(tf.baseFolder)).equals('abc');
            }
            catch (err) {
                expect.fail(err.message);
            }
            finally {
                tf.destroy();
            }
        });

    });
    describe('add()', function() {
        it('should create new folder within base path', function() {
            const tf = new Temp();
            const base = tf.baseFolder;

            const result = tf.add();

            expect(fs.statSync(result).isDirectory()).to.be.true;
            expect(dirname(result)).to.equal(base);

        });

    });
    describe('destroy()', function() {
        it('should remove system base', function() {
            mockFS({ 'folly': {} });

            const tf = new Temp('folly');
            const oldBase = dirname(tf.baseFolder);

            let subs = fs.readdirSync(oldBase);
            expect(subs).to.contain('folly');

            tf.destroy();
            subs = fs.readdirSync(oldBase);

            expect(subs).not.to.contain('folly');
            expect(tf.baseFolder).to.be.empty;
        });
    });
});
