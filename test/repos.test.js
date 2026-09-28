import assert from 'node:assert/strict';
import { after, describe, it, before } from 'node:test';
import { join, sep } from 'node:path';

import mockFS from 'mock-fs';

import {
    allRepoPaths,
    getBinaryPaths,
    getPackage
} from '../src/common/repos.js';

const fakePackage = {
    name: 'faker',
    version: '0.0.0',
    parentPath: 'wwwroot',
    repositories: [
        {
            name: 'root'
        },
        {
            name: 'tems'
        }
    ]
};

const fake = {
    root: {
        folder1: {
            '.git': {},
            a: {
                '.git': {}
            },
            afile: ''
        },
        folder2: {
            '.git': {}
        },
        folder3: {
            '.git': ''
        },
        '.git': '',
        'deploy-builder': {
            'package.json': JSON.stringify(fakePackage)
        },
        tems: {}
    }
};

// @TODO: mock out fileExists and folderExists
describe('Repositories Modules', function () {
    describe('allRepoPaths()', function () {
        before(function () {
            mockFS(fake);
        });

        after(function () {
            mockFS.restore();
        });

        it('should find git repos', async function () {
            const result = await allRepoPaths('./root');

            assert.strictEqual(result.length, 2);
            assert.ok(result.includes(`root${sep}folder1`));
            assert.ok(result.includes(`root${sep}folder2`));
        });

        it('should find only named git repos', async function () {
            const result = await allRepoPaths('./root', [ 'folder1' ]);

            assert.strictEqual(result.length, 1);
            assert.ok(result.includes(`root${sep}folder1`));
        });

        it('should not find any git repos when named is not a git repo', async function () {
            const result = await allRepoPaths('./root', [ 'folder3' ]);

            assert.strictEqual(result.length, 0);
        });

        it('should not find any git repos when root does not contain repos in immediate sub folders', async function () {
            const result = await allRepoPaths('.');

            assert.strictEqual(result.length, 0);
        });
    });

    describe('getPackage()', function () {
        it('should return empty object on failure', async function () {
            mockFS({ repo: {} });

            const { name, error } = await getPackage(join('repo', 'package.json'));

            assert.strictEqual(name, undefined);
            assert.strictEqual(error, true);

            mockFS.restore();
        });

        it('should return parsed JSON on success', async function () {
            const repo = {
                'package.json': JSON.stringify({ name: 'hello' })
            };
            mockFS({ repo });

            const file = join('repo', 'package.json');
            const { name, error } = await getPackage(file);

            assert.strictEqual(name, 'hello');
            assert.strictEqual(error, undefined);

            mockFS.restore();
        });
    });

    describe('getBinaryPaths()', function () {
        it('should return an empty object when required paths are missing', function () {
            const { buildRoot, gulpFile } = getBinaryPaths();

            assert.strictEqual(buildRoot, undefined);
            assert.strictEqual(gulpFile, undefined);
        });

        it('buildRoot should be within tooling', function () {
            const { buildRoot, gulpFile } = getBinaryPaths('myBuilder', 'myRepo', 'myRoot');

            assert.match(buildRoot, /^myRoot/);
            assert.match(buildRoot, /myBuilder$/);
            assert.match(gulpFile, /myBuilder/);
            assert.match(gulpFile, /gulp\.js$/);
        });

        it('buildRoot should be in calling repo', function () {
            const { buildRoot, gulpFile } = getBinaryPaths('', 'myRepo', 'myRoot');

            assert.match(buildRoot, /^myRepo/);
            assert.match(gulpFile, /^myRepo/);
            assert.match(gulpFile, /gulp\.js$/);
        });
    });
});