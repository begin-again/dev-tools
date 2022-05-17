const chai = require('chai');
const { expect } = chai;
const mockFS = require('mock-fs');

const files = require('./files.js');
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

describe('files module', () => {
    describe('findFirstFile()', () => {
        beforeEach(() => {
            mockFS(testFolder);
        });
        afterEach(mockFS.restore);
        it('should return null if supplied startPath does not exist as a folder', () => {
            const result = files.findFirstFile('missing', 'a/b/c/d/someFolder');

            expect(result).to.be.null;
        });
        it('should stop at root returning null', () => {
            const result = files.findFirstFile('missing', 'a/b');

            expect(result).to.be.null;
        });
        it('should return a path if found', () => {
            const result = files.findFirstFile('found', 'a/b/c/d');

            expect(result).is.a('String').with.length.greaterThan(0);
        });
        it('should trap errors returning null', () => {
            const result = files.findFirstFile(/wtf/);

            expect(result).to.be.null;
        });
    });
});
