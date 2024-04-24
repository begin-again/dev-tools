import { expect } from 'chai';
import mockFS from 'mock-fs';
import { findFirstFile } from '../src/common/files.js';

const testFolder = {
    a: {
        b: {
            xx: ''
            , c:{
                x:''
                , d: {
                    found: ''
                    , someFolder: {}
                }
            }
        }
    }
};

describe('files module', function() {
    describe('findFirstFile()', function() {
        beforeEach(function() {
            mockFS(testFolder);
        });
        afterEach(mockFS.restore);
        it('should return null if supplied startPath does not exist as a folder', function() {
            const result = findFirstFile('missing', 'a/b/c/d/someFolder');

            expect(result).to.be.null;
        });
        it('should stop at root returning null', function() {
            const result = findFirstFile('missing', 'a/b');

            expect(result).to.be.null;
        });
        it('should return a path if found', function() {
            const result = findFirstFile('found', 'a/b/c/d');

            expect(result).is.a('String').with.length.greaterThan(0);
        });
        it('should trap errors returning null', function() {
            const result = findFirstFile(/wtf/);

            expect(result).to.be.null;
        });
    });
});
