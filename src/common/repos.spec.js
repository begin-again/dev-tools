/* eslint-disable no-magic-numbers */
const chai = require('chai');
const { expect } = chai;
chai.use(require('sinon-chai'));

const mockFS = require('mock-fs');
const { join } = require('path');
const { allRepoPaths
    , getBinaryPaths
    , getPackage
} = require('./repos');
const { sep } = require('path');

const fakePackage = {
    'name': 'faker'
    , 'version': '0.0.0'
    , 'parentPath': 'wwwroot'
    , 'repositories': [
        {
            'name': 'root'
        }
        , {
            'name': 'tems'
        }
    ]
};

const fake = {
    root: {
        folder1: {
            '.git':{}
            , a: {
                '.git': {}
            }
            , afile: ''
        }
        , folder2: {
            '.git': {}
        }
        , folder3: {
            '.git': ''
        }
        , '.git': ''
        , 'deploy-builder': {
            'package.json': JSON.stringify(fakePackage)
        }
        , 'tems': {}
    }
};

// @TODO: mock out fileExists and folderExists
describe('Repositories Modules', () => {
    describe('allRepPaths', () => {
        before(() => {
            mockFS(fake);
        });
        after(mockFS.restore);
        it('should find git repos', () => {
            const result = allRepoPaths('./root');

            expect(result).an('array').of.length(2);
            expect(result).contains(`root${sep}folder1`);
            expect(result).contains(`root${sep}folder2`);
        });
        it('should find only named git repos', () => {
            const result = allRepoPaths('./root', [ 'folder1' ]);

            expect(result).an('array').of.length(1);
            expect(result).contains(`root${sep}folder1`);
        });
        it('should not find any git repos when named is not a git repo', () => {
            const result = allRepoPaths('./root', [ 'folder3' ]);

            expect(result).an('array').of.length(0);
        });
        it('should not find any git repos when root does not contain repos in immediate sub folders', () => {
            const result = allRepoPaths('.');

            expect(result).an('array').of.length(0);
        });
    });
    describe('getPackage()', () => {
        it('should return empty object on failure', () => {
            mockFS({ repo: { } });

            const { name, error } = getPackage(join('repo', 'package.json'));

            expect(name).to.be.undefined;
            expect(error).to.be.true;

            mockFS.restore();
        });
        it('should return parsed JSON on success', () => {
            mockFS({ repo: { 'package.json': JSON.stringify({ name: 'hello' }) } });

            const { name, error } = getPackage(join('repo', 'package.json'));

            expect(name).equals('hello');
            expect(error).to.be.undefined;

            mockFS.restore();
        });
    });
    describe('getBinaryPaths()', () => {
        it('should be empty object on join fails', () => {
            const { buildRoot, gulpFile } = getBinaryPaths();

            expect(buildRoot).to.be.undefined;
            expect(gulpFile).to.be.undefined;
        });
        it('buildRoot should be within tooling', () => {
            const { buildRoot, gulpFile } = getBinaryPaths('myBuilder', 'myRepo', 'myRoot');

            expect(buildRoot).matches(/^myRoot/);
            expect(buildRoot).matches(/myBuilder$/);
            expect(gulpFile).to.match(/myBuilder/);
            expect(gulpFile).to.match(/gulp\.js$/);
        });
        it('buildRoot should be in calling repo', () => {
            const { buildRoot, gulpFile } = getBinaryPaths('', 'myRepo', 'myRoot');

            expect(buildRoot).matches(/^myRepo/);
            expect(gulpFile).to.match(/^myRepo/);
            expect(gulpFile).to.match(/gulp\.js$/);
        });
    });
});
