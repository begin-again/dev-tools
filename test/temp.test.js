import assert from 'node:assert/strict';
import {
    afterEach,
    beforeEach,
    describe,
    it
} from 'node:test';
import {
    existsSync,
    readdirSync,
    statSync
} from 'node:fs';
import { dirname } from 'node:path';

import * as temp from '../src/common/temp.js';

describe('Temp Folder utility', function() {

    beforeEach(function() {
        temp.destroy();
    });

    afterEach(function() {
        temp.destroy();
    });

    describe('initBase()', function() {

        it('should not throw', function() {
            assert.equal(temp.baseFolder, undefined);

            assert.doesNotThrow(function() {
                temp.initBase();
            });

            assert.notEqual(temp.baseFolder, undefined);
        });

        it('should set base to system temp', function() {
            assert.equal(temp.baseFolder, undefined);

            const result = temp.initBase();

            assert.equal(statSync(result).isDirectory(), true);
            assert.deepEqual(readdirSync(result), []);
            assert.equal(temp.baseFolder, result);
        });

        it('should not set base more than once', function() {
            const first = temp.initBase();
            const second = temp.initBase();

            assert.equal(second, first);
        });
    });

    describe('createTempFolder()', function() {

        it('should create new folder within base path', function() {
            const base = temp.initBase();

            const result = temp.createTempFolder();

            assert.equal(statSync(result).isDirectory(), true);
            assert.equal(dirname(result), base);
        });

        it('should create unique folders', function() {
            temp.initBase();

            const first = temp.createTempFolder();
            const second = temp.createTempFolder();

            assert.notEqual(second, first);
            assert.equal(existsSync(first), true);
            assert.equal(existsSync(second), true);
        });

        it('should throw when base folder is not defined', function() {
            assert.throws(
                function() {
                    temp.createTempFolder();
                },
                /base folder not defined/
            );
        });
    });

    describe('destroy()', function() {

        it('should remove system base', function() {
            const base = temp.initBase();

            temp.destroy();

            assert.equal(temp.baseFolder, undefined);
            assert.equal(existsSync(base), false);
        });

        it('should do nothing when base is not defined', function() {
            assert.doesNotThrow(function() {
                temp.destroy();
            });
        });
    });
});