/* eslint-disable no-magic-numbers */
const chai = require('chai');
const { expect } = chai;
chai.use(require('sinon-chai'));

const mockFS = require('mock-fs');
const { join, sep } = require('node:path');
const { allRepoPaths
    , getBinaryPaths
    , getPackage
} = require('../src/common/repos');

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
describe('Repositories Modules', function () {
    describe('allRepPaths', function () {
        before(() => {
            mockFS(fake);
        });
        after(mockFS.restore);
        it('should find git repos', async function() {
            const result = await allRepoPaths('./root');

            expect(result).an('array').of.length(2);
            expect(result).contains(`root${sep}folder1`);
            expect(result).contains(`root${sep}folder2`);
        });
        it('should find only named git repos', async function() {
            const result = await allRepoPaths('./root', [ 'folder1' ]);

            expect(result).an('array').of.length(1);
            expect(result).contains(`root${sep}folder1`);
        });
        it('should not find any git repos when named is not a git repo', async function() {
            const result = await allRepoPaths('./root', [ 'folder3' ]);

            expect(result).an('array').of.length(0);
        });
        it('should not find any git repos when root does not contain repos in immediate sub folders', async function() {
            const result = await allRepoPaths('.');

            expect(result).an('array').of.length(0);
        });
    });
    describe('getPackage()', function () {
        it('should return empty object on failure', async function () {
            mockFS({ repo: { } });

            const { name, error } = await getPackage(join('repo', 'package.json'));

            expect(name).to.be.undefined;
            expect(error).to.be.true;

            mockFS.restore();
        });
        it('should return parsed JSON on success', async function () {
            const repo = {
                'package.json': JSON.stringify({ name: 'hello' })
            };
            mockFS({ repo });

            const file = join('repo', 'package.json');
            const { name, error } = await getPackage(file);

            expect(name).equals('hello');
            expect(error).to.be.undefined;

            mockFS.restore();
        });
    });
    describe('getBinaryPaths()', function () {
        it('should be empty object on join fails', function () {
            const { buildRoot, gulpFile } = getBinaryPaths();

            expect(buildRoot).to.be.undefined;
            expect(gulpFile).to.be.undefined;
        });
        it('buildRoot should be within tooling', function () {
            const { buildRoot, gulpFile } = getBinaryPaths('myBuilder', 'myRepo', 'myRoot');

            expect(buildRoot).matches(/^myRoot/);
            expect(buildRoot).matches(/myBuilder$/);
            expect(gulpFile).to.match(/myBuilder/);
            expect(gulpFile).to.match(/gulp\.js$/);
        });
        it('buildRoot should be in calling repo', function () {
            const { buildRoot, gulpFile } = getBinaryPaths('', 'myRepo', 'myRoot');

            expect(buildRoot).matches(/^myRepo/);
            expect(gulpFile).to.match(/^myRepo/);
            expect(gulpFile).to.match(/gulp\.js$/);
        });
    });
});
