import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import mockFS from 'mock-fs';

import * as files from '../src/common/files.js';

const testFolder = {
    a: {
        b: {
            xx: '',
            c: {
                x: '', 
                d: {
                    found: '',
                    someFolder: {}
                }
            }
        }
    }
};

describe('files module', function () {
    describe('findFirstFile()', function () {
        beforeEach(function () {
            mockFS(testFolder);
        });

        afterEach(function () {
            mockFS.restore();
        });

        it('should return null if supplied startPath does not exist as a folder', function () {
            const result = files.findFirstFile('missing', 'a/b/c/d/someFolder');

            assert.strictEqual(result, null);
        });

        it('should stop at root returning null', function () {
            const result = files.findFirstFile('missing', 'a/b');

            assert.strictEqual(result, null);
        });

        it('should return a path if found', function () {
            const result = files.findFirstFile('found', 'a/b/c/d');

            assert.strictEqual(typeof result, 'string');
            assert.ok(result.length > 0);
        });

        it('should trap errors returning null', function () {
            const result = files.findFirstFile(/wtf/);

            assert.strictEqual(result, null);
        });
    });
});