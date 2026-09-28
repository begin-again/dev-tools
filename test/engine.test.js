import assert from 'node:assert/strict';
import {
    chmodSync,
    mkdirSync,
    writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import {
    afterEach,
    beforeEach,
    describe,
    it,
    mock
} from 'node:test';

import {
    allInstalledNodeVersions,
    engineCheck,
    maxInstalledSatisfyingVersion,
    minInstalledSatisfyingVersion,
    properNodeVersions,
    satisfyingVersions,
    versionStringToNumber,
    versionStringToObject
} from '../src/common/engine.js';

import * as temp from '../src/common/temp.js';

describe('Engine Module', function() {

    describe('engineCheck()', function() {

        it('should not throw when compatible', function() {
            assert.doesNotThrow(function() {
                engineCheck(process.version);
            });
        });

        it('should throw on incompatible engines', function() {
            assert.throws(
                function() {
                    engineCheck('<0.0.1');
                },
                {
                    name: 'Error',
                    message: /Incompatible NodeJS version/
                }
            );
        });

        it('should write to log', function() {
            const log = mock.fn();

            assert.throws(
                function() {
                    engineCheck('<0.0.1', log);
                },
                /Incompatible NodeJS version/
            );

            assert.equal(log.mock.callCount(), 1);
        });

        it('should write to log with additional message', function() {
            const log = mock.fn();

            assert.throws(
                function() {
                    engineCheck('<0.0.1', log, 'target');
                },
                /Incompatible NodeJS version/
            );

            assert.equal(log.mock.callCount(), 1);
            assert.match(
                log.mock.calls[0].arguments[0],
                /^\( target \) detected version/
            );
        });
    });

    describe('satisfyingVersions()', function() {

        it('should be empty when nothing satisfies', function() {
            const versions = [
                { version: 'v10.12.13' }
            ];

            const result = satisfyingVersions(
                '12.11.0',
                versions
            );

            assert.deepEqual(result, []);
        });

        it('should exclude versions with errors', function() {
            const versions = [
                {
                    version: 'v12.11.0',
                    error: 'for shame'
                }
            ];

            const result = satisfyingVersions(
                '12.11.0',
                versions
            );

            assert.deepEqual(result, []);
        });

        it('should find matches sorted descending', function() {
            const versions = [
                { version: 'v10.12.13' },
                { version: 'v12.12.13' },
                { version: 'v12.19.0' }
            ];

            const result = satisfyingVersions(
                '^12.0.0',
                versions
            );

            assert.deepEqual(
                result.map(({ version }) => version),
                [
                    'v12.19.0',
                    'v12.12.13'
                ]
            );
        });

        it('should work with major versions', function() {
            const versions = [
                { version: 'v10.12.13' },
                { version: 'v12.12.13' },
                { version: 'v12.19.0' }
            ];

            const result = satisfyingVersions(
                '^12',
                versions
            );

            assert.deepEqual(
                result.map(({ version }) => version),
                [
                    'v12.19.0',
                    'v12.12.13'
                ]
            );
        });
    });

    describe('maxInstalledSatisfyingVersion()', function() {

        it('should be undefined when not satisfied', function() {
            const versions = [
                { version: 'v12.0.0' }
            ];

            const result = maxInstalledSatisfyingVersion(
                '^8.11.1',
                versions
            );

            assert.equal(result, undefined);
        });

        it('should select largest matching version', function() {
            const versions = [
                { version: 'v12.0.0' },
                { version: 'v12.19.0' }
            ];

            const result = maxInstalledSatisfyingVersion(
                '^12.0.0',
                versions
            );

            assert.equal(result.version, 'v12.19.0');
        });
    });

    describe('minInstalledSatisfyingVersion()', function() {

        it('should be undefined when not satisfied', function() {
            const versions = [
                { version: 'v12.0.0' }
            ];

            const result = minInstalledSatisfyingVersion(
                '^8.11.1',
                versions
            );

            assert.equal(result, undefined);
        });

        it('should select oldest matching version', function() {
            const versions = [
                { version: 'v12.19.0' },
                { version: 'v8.0.0' }
            ];

            const result = minInstalledSatisfyingVersion(
                '^12.0.0 || ^8.0.0',
                versions
            );

            assert.equal(result.version, 'v8.0.0');
        });

        it('should allow matching on major versions', function() {
            const versions = [
                { version: 'v12.19.0' },
                { version: 'v8.0.0' }
            ];

            const result = minInstalledSatisfyingVersion(
                '^12',
                versions
            );

            assert.equal(result.version, 'v12.19.0');
        });

        it('should pick 16.12.0 -- issue 116', function() {
            const versions = [
                { version: 'v16.13.0' },
                { version: 'v16.12.0' }
            ];

            const result = minInstalledSatisfyingVersion(
                '^16',
                versions
            );

            assert.equal(result.version, 'v16.12.0');
        });
    });

    describe('versionStringToNumber()', function() {

        it('should convert version to sortable number', function() {
            assert.equal(
                versionStringToNumber('v12.19.0'),
                121900
            );
        });

        it('should accept version without v prefix', function() {
            assert.equal(
                versionStringToNumber('12.19.0'),
                121900
            );
        });
    });

    describe('versionStringToObject()', function() {
        const versions = [
            { version: 'v2.3.0' },
            { version: 'v2.2.1' },
            { version: 'v2.2.0' },
            { version: 'v2.0.0' },
            { version: 'v1.1.1' }
        ];

        describe('default', function() {

            it('should find full versions', function() {
                const result = versionStringToObject(
                    '2.3.0',
                    versions
                );

                assert.equal(result.version, 'v2.3.0');
            });

            it('should find major versions', function() {
                const result = versionStringToObject(
                    '2',
                    versions
                );

                assert.equal(result.version, 'v2.3.0');
            });

            it('should find major.minor versions', function() {
                const result = versionStringToObject(
                    '2.2',
                    versions
                );

                assert.equal(result.version, 'v2.2.1');
            });

            it('should be undefined when not found', function() {
                const result = versionStringToObject(
                    '1.2.0',
                    versions
                );

                assert.equal(result, undefined);
            });
        });

        describe('oldest is true', function() {

            it('should find full versions', function() {
                const result = versionStringToObject(
                    '2.3.0',
                    versions,
                    true
                );

                assert.equal(result.version, 'v2.3.0');
            });

            it('should find major versions', function() {
                const result = versionStringToObject(
                    '2',
                    versions,
                    true
                );

                assert.equal(result.version, 'v2.0.0');
            });

            it('should find major.minor versions', function() {
                const result = versionStringToObject(
                    '2.2',
                    versions,
                    true
                );

                assert.equal(result.version, 'v2.2.0');
            });

            it('should be undefined when not found', function() {
                const result = versionStringToObject(
                    '1.2.0',
                    versions,
                    true
                );

                assert.equal(result, undefined);
            });
        });
    });

    describe('installed Node versions', function() {
        let root;

        beforeEach(function() {
            temp.initBase();
            root = temp.createTempFolder();
        });

        afterEach(function() {
            temp.destroy();
        });

        describe('allInstalledNodeVersions()', function() {

            it('should be empty when nvm environment is not defined', function() {
                const result = allInstalledNodeVersions(null, {});

                assert.deepEqual(result, []);
            });

            it(
                'should be empty when nvm root is not a folder',
                function() {
                    const env = process.platform === 'win32'
                        ? {
                            NVM_HOME: join(root, 'missing')
                        }
                        : {
                            NVM_DIR: join(root, 'missing')
                        };

                    const result = allInstalledNodeVersions(
                        null,
                        env
                    );

                    assert.deepEqual(result, []);
                }
            );

            it(
                'should find installed versions with nvm-windows',
                {
                    skip: process.platform !== 'win32'
                },
                function() {
                    const nvmHome = join(root, 'nvm');

                    createWindowsVersion(
                        nvmHome,
                        'v0.0.1'
                    );

                    createWindowsVersion(
                        nvmHome,
                        'v2.10.22'
                    );

                    createWindowsVersion(
                        nvmHome,
                        'v8.11.1'
                    );

                    createWindowsVersion(
                        nvmHome,
                        'v10.23.0'
                    );

                    mkdirSync(
                        join(nvmHome, 'not-a-version'),
                        {
                            recursive: true
                        }
                    );

                    const result = allInstalledNodeVersions(
                        null,
                        {
                            NVM_HOME: nvmHome
                        }
                    );

                    assert.deepEqual(
                        result.map(({ version }) => version),
                        [
                            'v10.23.0',
                            'v8.11.1',
                            'v2.10.22',
                            'v0.0.1'
                        ]
                    );

                    assert.equal(
                        result[0].path,
                        join(nvmHome, 'v10.23.0')
                    );

                    assert.equal(
                        result[0].bin,
                        join(
                            nvmHome,
                            'v10.23.0',
                            'node.exe'
                        )
                    );
                }
            );

            it(
                'should find installed versions with Linux nvm',
                {
                    skip: process.platform === 'win32'
                },
                function() {
                    const nvmDir = join(root, '.nvm');

                    createLinuxVersion(
                        nvmDir,
                        'v0.0.1'
                    );

                    createLinuxVersion(
                        nvmDir,
                        'v2.10.11'
                    );

                    createLinuxVersion(
                        nvmDir,
                        'v10.3.0'
                    );

                    createLinuxVersion(
                        nvmDir,
                        'v12.0.0'
                    );

                    mkdirSync(
                        join(
                            nvmDir,
                            'versions',
                            'node',
                            'not-a-version'
                        ),
                        {
                            recursive: true
                        }
                    );

                    const result = allInstalledNodeVersions(
                        null,
                        {
                            NVM_DIR: nvmDir
                        }
                    );

                    assert.deepEqual(
                        result.map(({ version }) => version),
                        [
                            'v12.0.0',
                            'v10.3.0',
                            'v2.10.11',
                            'v0.0.1'
                        ]
                    );

                    assert.equal(
                        result[0].path,
                        join(
                            nvmDir,
                            'versions',
                            'node',
                            'v12.0.0'
                        )
                    );

                    assert.equal(
                        result[0].bin,
                        join(
                            nvmDir,
                            'versions',
                            'node',
                            'v12.0.0',
                            'bin',
                            'node'
                        )
                    );
                }
            );
        });

        describe('properNodeVersions()', function() {

            it('should be empty when nvm environment is not defined', function() {
                const result = properNodeVersions(null, {});

                assert.deepEqual(result, []);
            });

            it(
                'should return valid nvm-windows versions',
                {
                    skip: process.platform !== 'win32'
                },
                function() {
                    const nvmHome = join(root, 'nvm');

                    createWindowsVersion(
                        nvmHome,
                        'v0.0.1',
                        true
                    );

                    createWindowsVersion(
                        nvmHome,
                        'v2.10.22',
                        true
                    );

                    createWindowsVersion(
                        nvmHome,
                        'v8.11.1',
                        false
                    );

                    createWindowsVersion(
                        nvmHome,
                        'v10.23.0',
                        false
                    );

                    const result = properNodeVersions(
                        null,
                        {
                            NVM_HOME: nvmHome
                        }
                    );

                    assert.deepEqual(
                        result.map(({ version }) => version),
                        [
                            'v2.10.22',
                            'v0.0.1'
                        ]
                    );

                    for(const version of result) {
                        assert.equal(
                            version.bin,
                            join(
                                version.path,
                                'node.exe'
                            )
                        );
                    }
                }
            );

            it(
                'should return valid Linux nvm versions',
                {
                    skip: process.platform === 'win32'
                },
                function() {
                    const nvmDir = join(root, '.nvm');

                    createLinuxVersion(
                        nvmDir,
                        'v0.0.1',
                        false
                    );

                    createLinuxVersion(
                        nvmDir,
                        'v2.10.11',
                        true
                    );

                    createLinuxVersion(
                        nvmDir,
                        'v10.3.0',
                        true
                    );

                    createLinuxVersion(
                        nvmDir,
                        'v12.0.0',
                        false
                    );

                    const result = properNodeVersions(
                        null,
                        {
                            NVM_DIR: nvmDir
                        }
                    );

                    assert.deepEqual(
                        result.map(({ version }) => version),
                        [
                            'v10.3.0',
                            'v2.10.11'
                        ]
                    );

                    for(const version of result) {
                        assert.equal(
                            version.bin,
                            join(
                                version.path,
                                'bin',
                                'node'
                            )
                        );
                    }
                }
            );
        });
    });
});

const createWindowsVersion = (
    nvmHome,
    version,
    withNode = true
) => {
    const versionPath = join(
        nvmHome,
        version
    );

    mkdirSync(versionPath, {
        recursive: true
    });

    if(withNode) {
        writeFileSync(
            join(versionPath, 'node.exe'),
            ''
        );
    }

    return versionPath;
};

const createLinuxVersion = (
    nvmDir,
    version,
    withNode = true
) => {
    const versionPath = join(
        nvmDir,
        'versions',
        'node',
        version
    );

    const binPath = join(
        versionPath,
        'bin'
    );

    mkdirSync(binPath, {
        recursive: true
    });

    if(withNode) {
        const nodePath = join(
            binPath,
            'node'
        );

        writeFileSync(nodePath, '');
        chmodSync(nodePath, 0o755);
    }

    return versionPath;
};