 
 
import { platform } from 'node:os';
import { sep } from 'node:path';
import mockFS from 'mock-fs';
import fs from 'node:fs';
import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai-es';
chai.use(sinonChai);
const isWindows = platform() === 'win32';
import semver from 'semver';

import { Engine } from '../src/common/engine.js';

// eslint-disable-next-line no-unused-vars
import Version from '../src/common/version.js';

const myVersions = {
    afile: 'hello'
    , nvm: {
        'v8.11.1':{
            'node64.exe': ''
            , node56: {}
        }
        , 'v0.0.1':{
            'node64.exe': ''
            , 'node.exe': ''
            , node56: {}
        }
        , 'v2.10.22':{
            'node.exe': ''
            , node56: {}
        }
        , 'v10.23.0':{
            'node64.exe': ''
            , node56: {}
            , node: {}
        }
        , 'v99.99.99':''
    }
    , '.nvm': {
        versions: {
            node: {
                'v10.03.0':{
                    bin: {
                        node64: ''
                        , node: ''
                        , node56: {}
                    }
                }
                , 'v0.0.1':{
                    bin: {
                        node64: ''
                        , node: mockFS.file({
                            content: ''
                            , mode: 0o666
                        })
                        , node56: {}
                    }
                }
                , 'v2.10.11':{
                    bin: {
                        node64: ''
                        , node:  mockFS.file({
                            content: ''
                            , mode: 0o755
                        })
                        , node56: {}
                    }
                }
                , 'v12.0.0':{
                    bin: {
                        node: ''
                        , node64: ''
                        , node56: {}
                    }
                }
                , 'v10.14.0':{
                    bin: {
                        node64: ''
                        , node56: {}
                    }
                }
                , 'v99.99.99':''
            }
        }
    }
};

describe('Engine Class', function() {
    const mockFSOptions = {
        env: { NVM_HOME: 'nvm' }
    };
    beforeEach(function() {
        mockFS(myVersions);
    });
    afterEach(mockFS.restore);
    describe('constructor', function() {
        it('parameters', function() {
            try {
                /** @type {Version[]} */
                const versions = [ {
                    error: 'bad'
                } ];
                const defaultVersion = '1.1.1';
                const engine = new Engine({
                    env: { NVM_HOME: 'nvm' }
                    , versions
                    , defaultVersion
                });
                expect(engine.versionsAll).lengthOf(versions.length);
                expect(engine.versions).lengthOf(0);
                expect(engine.defaultVersion).equals(defaultVersion);
            }
            catch (err) {
                expect.fail(err.message);
            }
        });
        it('without parameters', function() {
            // the versions will be obtained from the mocking of the file system
            try {
                // the env is still needed for consistent test result
                const engine = new Engine(mockFSOptions);
                expect(engine.versionsAll).lengthOf(4);
                expect(engine.versions).lengthOf(2);
                expect(engine.defaultVersion)
                    .is.a('string')
                    .length.greaterThan(0);
            }
            catch (err) {
                expect.fail(err.message);
            }
        });
    });
    describe('engineCheck()', function() {
        let satisfiesStub;
        let cleanStub;
        let logStub;
        beforeEach(function() {
            satisfiesStub = sinon.stub(semver, 'satisfies');
            cleanStub = sinon.stub(semver, 'clean');
            logStub = sinon.stub(console, 'error');
        });
        afterEach(function() {
            satisfiesStub.restore();
            cleanStub.restore();
            logStub.restore();
        });
        it('should not throw an error when the detected version is within the required range', function() {
            cleanStub.returns('12.13.1');
            satisfiesStub.returns(true);

            expect(() => Engine.engineCheck('>=12.13.1', console.error, 'ERROR: ')).to.not.throw();
            expect(logStub).to.not.have.been.called;
        });

        it('should throw an error when the detected version is not within the required range', function() {
            cleanStub.returns('12.13.0');
            satisfiesStub.returns(false);

            expect(() => Engine.engineCheck('>=12.13.1', console.error, 'ERROR: ')).to.throw();
            expect(logStub).to.have.been.calledOnce;
        });
    });
    describe('versionStringToNumber', function() {
        it('should correctly convert a version string to a number', function() {
            const version = 'v12.13.1';
            const result = Engine.versionStringToNumber(version);
            expect(result).to.equal(12013001);
        });

        it('should correctly handle version strings without a leading "v"', function() {
            const version = '12.13.1';
            const result = Engine.versionStringToNumber(version);
            expect(result).to.equal(12013001);
        });

        it('should return NaN for invalid version strings', function() {
            const version = 'invalid';
            const result = Engine.versionStringToNumber(version);
            expect(result).to.be.NaN;
        });
    });

    describe('versionToUseValidator', function() {
        let satisfyingVersionsStub;
        let versionStringToObjectStub;
        let minInstalledSatisfyingVersionStub;
        let maxInstalledSatisfyingVersionStub;

        beforeEach(function() {
            satisfyingVersionsStub = sinon.stub(Engine.prototype, 'satisfyingVersions');
            versionStringToObjectStub = sinon.stub(Engine, 'versionStringToObject');
            minInstalledSatisfyingVersionStub = sinon.stub(Engine.prototype, 'minInstalledSatisfyingVersion');
            maxInstalledSatisfyingVersionStub = sinon.stub(Engine.prototype, 'maxInstalledSatisfyingVersion');
        });

        afterEach(function() {
            satisfyingVersionsStub.restore();
            versionStringToObjectStub.restore();
            minInstalledSatisfyingVersionStub.restore();
            maxInstalledSatisfyingVersionStub.restore();
        });

        it('should return the version if it satisfies the engine requirements', function() {
            const path = '/path/to/repo';
            const version = '1.2.3';
            const repoEngines = '>=1.2.3';
            const satisfies = [ { version: '1.2.3' } ];

            satisfyingVersionsStub.returns(satisfies);
            versionStringToObjectStub.returns({ version });

            const result = new Engine(mockFSOptions).versionToUseValidator({ path, version }, { repositoryEngines: repoEngines });

            expect(result).to.deep.equal({ version });
        });

        it('should return the minimum installed satisfying version if oldest is true', function() {
            const path = '/path/to/repo';
            const repoEngines = '>=1.2.3';
            const minVersion = { version: '1.2.3' };

            minInstalledSatisfyingVersionStub.returns(minVersion);

            const result = new Engine(mockFSOptions).versionToUseValidator({ path, oldest: true }, { repositoryEngines: repoEngines });

            expect(result).to.deep.equal(minVersion);
        });

        it('should return the maximum installed satisfying version if oldest is false', function() {
            const path = '/path/to/repo';
            const repoEngines = '>=1.2.3';
            const maxVersion = { version: '1.2.3' };

            maxInstalledSatisfyingVersionStub.returns(maxVersion);

            const result = new Engine(mockFSOptions).versionToUseValidator({ path }, { repositoryEngines: repoEngines });

            expect(result).to.deep.equal(maxVersion);
        });

        it('should throw a RangeError if no satisfying versions are installed', function() {
            const path = '/path/to/repo';
            const version = '16.15.0';
            const repoEngines = '^8.11.1 || ^10.13.0 || ^12.13.0';

            satisfyingVersionsStub.returns([]);

            expect(() => new Engine(mockFSOptions).versionToUseValidator({ path, version }, { repositoryEngines: repoEngines })).to.throw(RangeError);
        });
    });
    describe('maxInstalledSatisfyingVersion()', function() {
        it('should be undefined when not satisfied', function() {
            const versions = [ { version: 'v12.0.0' } ];
            const stub = sinon.stub();

            const result = new Engine({ versions }).maxInstalledSatisfyingVersion('^8.11.1', stub);

            expect(result).to.be.undefined;
            expect(stub).not.called;
        });
        it('should be versions', function() {
            const versions = [ { version: 'v12.0.0' } ];

            const { version } = new Engine({ versions }).maxInstalledSatisfyingVersion('^12.0.0');

            expect(version).to.equal(versions[0].version);
        });
        it('should be versions largest matching version', function() {
            const versions = [ { version: 'v12.19.0' }, { version: 'v12.0.0' } ];

            const { version } = new Engine({ versions }).maxInstalledSatisfyingVersion('^12.0.0');

            expect(version).to.equal(versions[0].version);
        });
    });
    describe('minInstalledSatisfyingVersion', function() {
        it('should return the oldest installed version that satisfies the required range', function() {
            const versions = [ { version: 'v8.0.0' }, { version: 'v12.19.0' } ];

            const result = new Engine({ versions }).minInstalledSatisfyingVersion('^12.0.0 || ^8.0.0');

            expect(result.version).to.equal(versions[0].version);
        });
        it('should pick 16.12.0 -- issue 116', function() {
            const versions = [ { version: 'v16.13.0' }, { version: 'v16.12.0' } ];

            const result = new Engine({ versions }).minInstalledSatisfyingVersion('^16');

            expect(result.version).to.equal(versions[1].version);
        });
        it('should allow matching on major versions', function() {
            const versions = [ { version: 'v12.19.0' }, { version: 'v8.0.0' } ];

            const result = new Engine({ versions }).minInstalledSatisfyingVersion('^12');

            expect(result.version).to.equal(versions[0].version);
        });
        it('should return undefined if no installed versions satisfy the required range', function() {
            const versions = [ { version: 'v12.0.0' } ];

            const result = new Engine({ versions }).minInstalledSatisfyingVersion('^8.11.1');

            expect(result).to.be.undefined;
        });
    });
    describe('versionStringToObject()', function() {
        // versions array is sorted in version descending order
        const versions = [
            { version: 'v2.3.0' }
            , { version: 'v2.2.1' }
            , { version: 'v2.2.0' }
            , { version: 'v2.0.0' }
            , { version: 'v1.1.1' }
        ];
        describe('default', function() {
            it('should find full versions', function() {
                const versionExpected = 'v2.3.0';

                const { version } = Engine.versionStringToObject('2.3.0', versions);

                expect(version).to.equal(versionExpected);
            });
            it('should find major versions', function() {
                const versionExpected = 'v2.3.0';

                const { version } = Engine.versionStringToObject('2', versions);

                expect(version).to.equal(versionExpected);
            });
            it('should find major.minor versions', function() {
                const versionExpected = 'v2.2.1';

                const { version } = Engine.versionStringToObject('2.2', versions);

                expect(version).to.equal(versionExpected);
            });
            it('should be undefined when not found', function() {
                const result = Engine.versionStringToObject('1.2.0', versions);

                expect(result).to.be.undefined;
            });
        });
        describe('oldest is true', function() {
            it('should find full versions', function() {
                const versionExpected = 'v2.3.0';

                const { version } = Engine.versionStringToObject('2.3.0', versions, true);

                expect(version).to.equal(versionExpected);
            });
            it('should find major versions', function() {
                const versionExpected = 'v2.0.0';

                const { version } = Engine.versionStringToObject('2', versions, true);

                expect(version).to.equal(versionExpected);
            });
            it('should find major.minor versions', function() {
                const versionExpected = 'v2.2.0';

                const { version } = Engine.versionStringToObject('2.2', versions, true);

                expect(version).to.equal(versionExpected);
            });
            it('should be undefined when not found', function() {
                const result = Engine.versionStringToObject('1.2.0', versions, true);

                expect(result).to.be.undefined;
            });
        });
    });
});
