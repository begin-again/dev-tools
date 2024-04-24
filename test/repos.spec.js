
import { join, sep } from 'node:path';
import { expect } from 'chai';
import mockFS from 'mock-fs';
import { allRepoPaths, getPackage } from '../src/common/repos.js';

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
});
