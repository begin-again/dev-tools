/* eslint-disable no-magic-numbers */

import assert from 'node:assert/strict';
import {
    chmodSync,
    existsSync,
    lstatSync,
    mkdirSync,
    readFileSync,
    symlinkSync,
    writeFileSync,
    unlinkSync
} from 'node:fs';
import { join } from 'node:path';
import {
    afterEach,
    beforeEach,
    describe,
    it,
    mock
} from 'node:test';

import Version from '../../src/common/Version.js';
import * as temp from '../../src/common/temp.js';

import clean from '../../src/node-tools/clean.js';
import fix from '../../src/node-tools/fix.js';
import remove from '../../src/node-tools/remove.js';
import report from '../../src/node-tools/report.js';

const isWindows = process.platform === 'win32';

let root;
let version10;
let version12;
let version14;
let logger;

describe('node-tools', function() {

    beforeEach(function() {
        temp.initBase();
        root = temp.createTempFolder();

        const path10 = createVersionFolder('v10.0.0');
        const path12 = createVersionFolder('v12.0.0');
        const path14 = createVersionFolder('v14.0.0');

        if(isWindows) {
            writeFileSync(
                join(path10, 'node64.exe'),
                'content'
            );

            symlinkSync(
                join(path10, 'node64.exe'),
                join(path10, 'node.exe')
            );

            writeFileSync(
                join(path12, 'node64.exe'),
                'content'
            );

            writeFileSync(
                join(path12, 'node.exe'),
                'content'
            );

            writeFileSync(
                join(path14, 'node64.exe'),
                'content64'
            );
        }
        else {
            createLinuxExecutable(path10);
            createLinuxExecutable(path12);

            // Version 14 deliberately has no node executable.
            mkdirSync(
                join(path14, 'bin'),
                { recursive: true }
            );
        }

        version10 = new Version(
            'v10.0.0',
            path10
        );

        version12 = new Version(
            'v12.0.0',
            path12
        );

        version14 = new Version(
            'v14.0.0',
            path14
        );

        logger = {
            debug: mock.fn(),
            error: mock.fn()
        };
    });

    afterEach(function() {
        temp.destroy();
    });

    describe('clean', function() {

        it(
            'should remove only symbolic links',
            {
                skip: !isWindows
            },
            function() {
                const installed = [
                    version10,
                    version12
                ];

                assert.equal(
                    existsSync(version10.bin),
                    true
                );

                assert.equal(
                    existsSync(version12.bin),
                    true
                );

                clean(
                    {
                        installed,
                        execute: true
                    },
                    logger
                );

                assert.equal(
                    existsSync(version10.bin),
                    false
                );

                assert.equal(
                    existsSync(version12.bin),
                    true
                );
            }
        );

        it('should report only when execute is false',
            {
                skip: !isWindows
            },
            function() {
                const installed = [
                    version10,
                    version12
                ];

                clean(
                    {
                        installed,
                        execute: false
                    },
                    logger
                );

                assert.equal(
                    existsSync(version10.bin),
                    true
                );

                assert.equal(
                    existsSync(version12.bin),
                    true
                );

                assert.equal(
                    logger.debug.mock.callCount(),
                    1
                );

                assert.match(
                    logger.debug.mock.calls[0].arguments[0],
                    /will delete node\.exe/
                );
            }
        );

        it('should not remove a Linux node symbolic link when execute is false',
            {
                skip: isWindows
            },
            function() {
                const target = join(
                    version10.path,
                    'bin',
                    'node-real'
                );

                const link = join(
                    version10.path,
                    'bin',
                    'node'
                );

                unlinkSync(link);
                writeFileSync(target, 'content');
                chmodSync(target, 0o755);
                symlinkSync(target, link);

                const linkedVersion = new Version(
                    'v10.0.0',
                    version10.path
                );

                clean(
                    {
                        installed: [ linkedVersion ],
                        execute: false
                    },
                    logger
                );

                assert.equal(existsSync(link), true);
                assert.equal(existsSync(target), true);

                assert.match(
                    logger.debug.mock.calls[0].arguments[0],
                    /will delete node/
                );
            }
        );

        it('should remove a Linux node symbolic link',
            {
                skip: isWindows
            },
            function() {
                const target = join(
                    version10.path,
                    'bin',
                    'node-real'
                );

                const link = join(
                    version10.path,
                    'bin',
                    'node'
                );

                // Replace the regular node executable created by beforeEach.
                unlinkSync(link);
                writeFileSync(target, 'content');
                chmodSync(target, 0o755);
                symlinkSync(target, link);

                // Version needs to inspect the new symbolic link.
                const linkedVersion = new Version(
                    'v10.0.0',
                    version10.path
                );

                assert.equal(linkedVersion.isLink, true);
                assert.equal(existsSync(link), true);

                clean(
                    {
                        installed: [ linkedVersion ],
                        execute: true
                    },
                    logger
                );

                assert.equal(existsSync(link), false);
                assert.equal(existsSync(target), true);

                assert.match(
                    logger.debug.mock.calls[0].arguments[0],
                    /deleted symbolic link/
                );
            }
        );
    });

    describe('report', function() {

        it('should report Windows findings',
            {
                skip: !isWindows
            },
            function() {
                const installed = [
                    version10,
                    version12,
                    version14
                ];

                report(
                    { installed },
                    logger
                );

                assert.equal(
                    logger.debug.mock.callCount(),
                    4
                );

                assert.equal(
                    logger.debug.mock.calls[0].arguments[0],
                    ' - v10.0.0   - OK (link)'
                );

                assert.equal(
                    logger.debug.mock.calls[1].arguments[0],
                    ' - v12.0.0   - OK '
                );

                assert.match(
                    logger.debug.mock.calls[2].arguments[0],
                    /^ - v14\.0\.0\s+- Problem: unable to find executable for version v14\.0\.0 in /
                );

                assert.equal(
                    logger.debug.mock.calls[3].arguments[0],
                    ''
                );
            }
        );

        it('should report Linux findings',
            {
                skip: isWindows
            },
            function() {
                const installed = [
                    version10,
                    version12,
                    version14
                ];

                report(
                    { installed },
                    logger
                );

                assert.equal(
                    logger.debug.mock.callCount(),
                    4
                );

                assert.equal(
                    logger.debug.mock.calls[0].arguments[0],
                    ' - v10.0.0   - OK '
                );

                assert.equal(
                    logger.debug.mock.calls[1].arguments[0],
                    ' - v12.0.0   - OK '
                );

                assert.match(
                    logger.debug.mock.calls[2].arguments[0],
                    /^ - v14\.0\.0\s+- Problem: unable to find executable for version v14\.0\.0 in /
                );

                assert.equal(
                    logger.debug.mock.calls[3].arguments[0],
                    ''
                );
            }
        );
    });

    describe('fix', function() {

        it('should create a symbolic link',
            {
                skip: !isWindows
            },
            function() {
                const installed = [
                    version10,
                    version12,
                    version14
                ];

                fix(
                    {
                        installed,
                        execute: true,
                        mode: 'link'
                    },
                    logger
                );

                const nodePath = join(
                    version14.path,
                    'node.exe'
                );

                assert.equal(
                    existsSync(nodePath),
                    true
                );

                assert.equal(
                    lstatSync(nodePath).isSymbolicLink(),
                    true
                );
            }
        );

        it('should create copy of node64.exe',
            {
                skip: !isWindows
            },
            function() {
                const installed = [
                    version10,
                    version12,
                    version14
                ];

                fix(
                    {
                        installed,
                        execute: true,
                        mode: 'copy'
                    },
                    logger
                );

                const nodePath = join(
                    version14.path,
                    'node.exe'
                );

                assert.equal(
                    existsSync(nodePath),
                    true
                );

                assert.equal(
                    lstatSync(nodePath).isSymbolicLink(),
                    false
                );

                assert.equal(
                    readFileSync(nodePath, 'utf8'),
                    'content64'
                );
            }
        );

        it('should report that a broken Linux installation cannot be repaired',
            {
                skip: isWindows
            },
            function() {
                const result = fix(
                    {
                        installed: [ version14 ],
                        execute: true,
                        mode: 'copy'
                    },
                    logger
                );

                assert.equal(result, 1);

                assert.equal(
                    existsSync(
                        join(
                            version14.path,
                            'bin',
                            'node'
                        )
                    ),
                    false
                );

                assert.equal(
                    logger.error.mock.callCount(),
                    1
                );

                assert.match(
                    logger.error.mock.calls[0].arguments[0],
                    /unable to find an executable to repair/
                );
            }
        );

        it('should report an unsupported Linux repair during dry-run',
            {
                skip: isWindows
            },
            function() {
                const result = fix(
                    {
                        installed: [ version14 ],
                        execute: false,
                        mode: 'link'
                    },
                    logger
                );

                assert.equal(result, 1);
                assert.equal(logger.error.mock.callCount(), 1);
                assert.equal(logger.debug.mock.callCount(), 0);
            }
        );
    });

    describe('remove', function() {

        it('should not remove when execute is false', async function() {
            const installed = [
                version10,
                version12
            ];

            await remove(
                {
                    installed,
                    execute: false,
                    version: '10.0.0'
                },
                logger
            );

            assert.equal(
                existsSync(version10.path),
                true
            );

            assert.equal(
                existsSync(version12.path),
                true
            );

            assert.equal(
                logger.debug.mock.callCount(),
                1
            );
        });

        it(
            'should report but not remove matched range when execute is false',
            async function() {
                const installed = [
                    version10,
                    version12
                ];

                await remove(
                    {
                        installed,
                        execute: false,
                        version: '10.0.0'
                    },
                    logger
                );

                assert.equal(
                    existsSync(version10.path),
                    true
                );

                assert.equal(
                    existsSync(version12.path),
                    true
                );

                assert.equal(
                    logger.debug.mock.callCount(),
                    1
                );

                assert.match(
                    logger.debug.mock.calls[0].arguments[0],
                    /^Would remove/
                );
            }
        );

        it(
            'should remove only matched range when execute is true',
            async function() {
                const installed = [
                    version10,
                    version12
                ];

                await remove(
                    {
                        installed,
                        execute: true,
                        version: '10.0.0'
                    },
                    logger
                );

                assert.equal(
                    existsSync(version10.path),
                    false
                );

                assert.equal(
                    existsSync(version12.path),
                    true
                );

                assert.equal(
                    logger.debug.mock.callCount(),
                    1
                );

                assert.match(
                    logger.debug.mock.calls[0].arguments[0],
                    /^Removed/
                );
            }
        );

        it(
            'should report when no installed versions match range',
            async function() {
                const installed = [
                    version10,
                    version12
                ];

                await remove(
                    {
                        installed,
                        execute: false,
                        version: '5.0.0'
                    },
                    logger
                );

                assert.equal(
                    existsSync(version10.path),
                    true
                );

                assert.equal(
                    existsSync(version12.path),
                    true
                );

                assert.equal(
                    logger.debug.mock.callCount(),
                    1
                );

                assert.match(
                    logger.debug.mock.calls[0].arguments[0],
                    /^No matches found for/
                );
            }
        );
    });
});

const createVersionFolder = (version) => {
    const path = join(root, version);

    mkdirSync(path, {
        recursive: true
    });

    return path;
};

const createLinuxExecutable = (path) => {
    const binPath = join(path, 'bin');
    const nodePath = join(binPath, 'node');

    mkdirSync(binPath, {
        recursive: true
    });

    writeFileSync(nodePath, 'content');
    chmodSync(nodePath, 0o755);
};
