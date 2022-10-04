const chai = require('chai');
const { expect } = chai;
const sinon = require('sinon');
chai.use(require('sinon-chai'));
const mockFS = require('mock-fs');
const { sep } = require('path');
const proxyquire = require('proxyquire').noCallThru();

const removeVersions = (engine) => {
    if(engine.versions) {
        delete engine.versions;
    }
};
const engine = require('./engine');

describe('Engine Module', function() {
    let logSpy;
    beforeEach(function() {
        logSpy = sinon.stub();
    });
    afterEach(sinon.restore);
    describe('engineCheck()', function() {
        it('should not throw when compatible', function() {
            const satisfyFake = sinon.fake.returns(true);
            const cleanFake = sinon.fake.returns('6.5.1');
            const { engineCheck } = proxyquire('./engine', {
                'semver': { satisfies: satisfyFake, clean: cleanFake }
            });

            engineCheck('^6.5.0', null);
            expect(logSpy).not.called;
            expect(cleanFake).calledOnce;
            expect(satisfyFake).calledOnce;
        });
        it('should throw on incompatible engines', function() {
            const expected = 'Incompatible NodeJS version: detected version 6.5.0 but required ~6.1.0';
            const satisfyFake = sinon.fake.returns(false);
            const cleanFake = sinon.fake.returns('6.5.0');
            const { engineCheck } = proxyquire('./engine', {
                'semver': { satisfies: satisfyFake, clean: cleanFake }
            });

            const wrapper = () => engineCheck('~6.1.0', null);

            expect(wrapper).to.throw(expected);
            expect(logSpy).not.called;
            expect(cleanFake).calledOnce;
            expect(satisfyFake).calledOnce;
        });
        it('should write to log', function() {
            const expected = 'Incompatible NodeJS version: detected version 6.5.0 but required ~6.1.0';
            const satisfyFake = sinon.fake.returns(false);
            const cleanFake = sinon.fake.returns('6.5.0');
            const { engineCheck } = proxyquire('./engine', {
                'semver': { satisfies: satisfyFake, clean: cleanFake }
            });

            const wrapper = () => engineCheck('~6.1.0', logSpy);

            expect(wrapper).to.throw(expected);
            expect(logSpy).calledOnce;
            expect(cleanFake).calledOnce;
            expect(satisfyFake).calledOnce;
        });
        it('should write to log with additional message', function() {
            const expectedMsg = '( target ) detected version 6.5.0 but required ~6.1.0';
            const expected = `Incompatible NodeJS version: ${expectedMsg}`;
            const satisfyFake = sinon.fake.returns(false);
            const cleanFake = sinon.fake.returns('6.5.0');
            const { engineCheck } = proxyquire('./engine', {
                'semver': { satisfies: satisfyFake, clean: cleanFake }
            });

            const wrapper = () => engineCheck('~6.1.0', logSpy, 'target');

            expect(wrapper).to.throw(expected);
            expect(logSpy).calledOnceWith(expectedMsg);
            expect(cleanFake).calledOnce;
            expect(satisfyFake).calledOnce;
        });
    });
    describe('satisfyingVersions()', function() {
        beforeEach(removeVersions.bind(null, engine));
        it('should be empty array when nothing satisfies', function() {
            const stub = sinon.stub(engine, 'properNodeVersions');
            engine.versions = [ { version: 'v10.12.13' } ];

            const result = engine.satisfyingVersions('12.11.0');

            expect(result).to.be.an('array').lengthOf(0);

            expect(stub).not.called;
            stub.reset();
        });
        it('should be empty array when nothing satisfies due to an error', function() {
            const stub = sinon.stub(engine, 'properNodeVersions');
            engine.versions = [ { version: 'v10.12.13', error: 'for shame' } ];
            const result = engine.satisfyingVersions('12.11.0');

            expect(result).to.be.an('array').lengthOf(0);

            expect(stub).not.called;
            stub.reset();
        });
        it('should be empty array when nothing satisfies due to an error', function() {
            const installedNodeVersionsStub = sinon.stub(engine, 'properNodeVersions');
            engine.versions = [ { version: 'v10.12.13', error: 'for shame' } ];
            const result = engine.satisfyingVersions('12.11.0');

            expect(result).to.be.an('array').lengthOf(0);

            expect(installedNodeVersionsStub).not.called;
            installedNodeVersionsStub.reset();
        });
        it('should find 2 matches sorted desc', function() {
            const stub = sinon.stub(engine, 'properNodeVersions');
            engine.versions = [
                { version: 'v10.12.13' }
                , { version: 'v12.12.13' }
                , { version: 'v12.19.0' }
            ];
            const result = engine.satisfyingVersions('^12.0.0');

            expect(result).to.be.an('array').lengthOf(2);
            expect(result[0].version).to.equal('v12.19.0');
            expect(result[1].version).to.equal('v12.12.13');

            expect(stub).not.called;
            stub.reset();
        });
        it('should find 2 matches sorted desc via default', function() {
            engine.versions = [
                { version: 'v10.12.13' }
                , { version: 'v12.12.13' }
                , { version: 'v12.19.0' }
            ];
            const stub = sinon.stub(engine, 'properNodeVersions');

            const result = engine.satisfyingVersions('^12.0.0');

            expect(result).to.be.an('array').lengthOf(2);
            expect(result[0].version).to.equal('v12.19.0');
            expect(result[1].version).to.equal('v12.12.13');

            expect(stub).not.called;
            stub.reset();
        });
        it('should find 2 matches sorted desc via default when engines.versions not defined', function() {
            const versions = [
                { version: 'v10.12.13' }
                , { version: 'v12.12.13' }
                , { version: 'v12.19.0' }
            ];
            const stub = sinon.stub(engine, 'properNodeVersions').returns(versions);
            expect(engine.versions).to.be.undefined;

            const result = engine.satisfyingVersions('^12.0.0');

            expect(stub).calledOnce;
            expect(result).to.be.an('array').lengthOf(2);
            expect(result[0].version).to.equal('v12.19.0');
            expect(result[1].version).to.equal('v12.12.13');

            stub.reset();
        });
        it('should work with major versions', function() {
            const versions = [
                { version: 'v10.12.13' }
                , { version: 'v12.12.13' }
                , { version: 'v12.19.0' }
            ];
            const stub = sinon.stub(engine, 'properNodeVersions').returns(versions);
            expect(engine.versions).to.be.undefined;

            const result = engine.satisfyingVersions('^12');

            expect(stub).calledOnce;
            expect(result).to.be.an('array').lengthOf(2);
            expect(result[0].version).to.equal('v12.19.0');
            expect(result[1].version).to.equal('v12.12.13');

        });
    });
    describe('node version managers', function() {
        const env = {};
        beforeEach(function() {
            delete env.NVM_HOME;
            delete env.NVM_BIN;
            if(engine.versions) {
                delete engine.versions;
            }
            mockFS({
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
            });
        });
        afterEach(mockFS.restore);

        describe('allInstalledNodeVersions()', function() {
            it('should be empty if not env', function() {
                const result = engine.allInstalledNodeVersions(null, {});

                expect(result).to.be.an('array').lengthOf(0);
            });
            it('should be empty if nvm home is not a folder', function() {
                env.NVM_HOME = 'afile';
                const result = engine.allInstalledNodeVersions(null, env);

                expect(result).to.be.an('array').lengthOf(0);
            });
            it('should find 4 versions in nvm', function() {
                env.NVM_HOME = 'nvm';
                const result = engine.allInstalledNodeVersions(null, env);

                expect(result).to.be.an('array');
                for(const version of result) {
                    expect(version).to.have.property('version');
                    expect(version).to.have.property('path');
                }
                const [ v1, v2, v3, v4, v5 ] = result;
                expect(v1.version).to.equal('v10.23.0');
                expect(v2.version).to.equal('v8.11.1');
                expect(v3.version).to.equal('v2.10.22');
                expect(v4.version).to.equal('v0.0.1');
                expect(v5).to.be.undefined;

            });
        });
        describe('properNodeVersions()', function() {
            it('should be empty when no env vars present', function() {
                expect(engine.versions).to.be.undefined;
                const result = engine.properNodeVersions(null, env);

                expect(result).to.be.an('array').lengthOf(0);
                expect(engine.versions).to.be.an('array').lengthOf(0);
            });
            describe('NVM for Windows', function() {
                it('should have length of 2', function() {
                    env.NVM_HOME = 'nvm';
                    expect(engine.versions).to.be.undefined;

                    const result = engine.properNodeVersions(null, env);

                    expect(result).to.be.an('array').lengthOf(2);
                    expect(result[0].version).to.equal('v2.10.22');
                    expect(result[1].version).to.equal('v0.0.1');
                    expect(engine.versions).lengthOf(2);
                });
                it('should have path to binary on windows', function() {
                    env.NVM_HOME = 'nvm';
                    const { bin, path } = engine.properNodeVersions(null, env)[0];

                    expect(bin).to.equal(`${path}${sep}node.exe`);
                });
                it('should have path to binary when not named \'node\'', function() {
                    env.NVM_HOME = 'nvm';
                    const { bin, path } = engine.properNodeVersions(null, env)[1];

                    expect(bin).to.equal(`${path}${sep}node.exe`);
                });
            });
        });
    });
    describe('maxInstalledSatisfyingVersion()', function() {
        beforeEach(removeVersions.bind(null, engine));
        it('should be undefined when not satisfied', function() {
            engine.versions = [ { version: 'v12.0.0' } ];
            const stub = sinon.stub(engine, 'properNodeVersions');
            expect(stub.wrappedMethod).not.to.be.undefined;

            const result = engine.maxInstalledSatisfyingVersion('^8.11.1');

            expect(result).to.be.undefined;
            expect(stub).not.called;
            stub.reset();
        });
        it('should be versions', function() {
            engine.versions = [ { version: 'v12.0.0' } ];
            const stub = sinon.stub(engine, 'properNodeVersions');
            expect(stub.wrappedMethod).not.to.be.undefined;

            const { version } = engine.maxInstalledSatisfyingVersion('^12.0.0');

            expect(version).to.equal(engine.versions[0].version);
            expect(stub).not.called;
            stub.reset();
        });
        it('should be versions largest matching version', function() {
            engine.versions = [ { version: 'v12.19.0' }, { version: 'v12.0.0' } ];
            const stub = sinon.stub(engine, 'properNodeVersions');

            const { version } = engine.maxInstalledSatisfyingVersion('^12.0.0');

            expect(version).to.equal(engine.versions[0].version);
            expect(stub.wrappedMethod).not.to.be.undefined;
            stub.reset();
        });
    });
    describe('minInstalledSatisfyingVersion()', function() {
        beforeEach(removeVersions.bind(null, engine));
        it('should be undefined when not satisfied', function() {
            engine.versions = [ { version: 'v12.0.0' } ];
            const stub = sinon.stub(engine, 'properNodeVersions');
            expect(stub.wrappedMethod).not.to.be.undefined;

            const result = engine.minInstalledSatisfyingVersion('^8.11.1');

            expect(result).to.be.undefined;
            expect(stub).not.called;
            stub.reset();
        });
        it('should be versions', function() {
            engine.versions = [ { version: 'v12.0.0' } ];
            const stub = sinon.stub(engine, 'properNodeVersions');
            expect(stub.wrappedMethod).not.to.be.undefined;

            const { version } = engine.minInstalledSatisfyingVersion('^12.0.0');

            expect(version).to.equal(engine.versions[0].version);
            expect(stub).not.called;
            stub.reset();
        });
        it('should be versions oldest matching version', function() {
            engine.versions = [ { version: 'v12.19.0' }, { version: 'v8.0.0' } ];
            const stub = sinon.stub(engine, 'properNodeVersions');

            const { version } = engine.minInstalledSatisfyingVersion('^12.0.0 || ^8.0.0');

            expect(version).to.equal(engine.versions[1].version);
            expect(stub.wrappedMethod).not.to.be.undefined;
            stub.reset();
        });
        it('should allow matching on major versions', function() {
            engine.versions = [ { version: 'v12.19.0' }, { version: 'v8.0.0' } ];
            const stub = sinon.stub(engine, 'properNodeVersions');

            const { version } = engine.minInstalledSatisfyingVersion('^12');

            expect(version).to.equal(engine.versions[0].version);
            expect(stub.wrappedMethod).not.to.be.undefined;
            stub.reset();
        });
        it('should pick 16.12.0 -- issue 116', function() {
            engine.versions = [ { version: 'v16.13.0' }, { version: 'v16.12.0' } ];
            const stub = sinon.stub(engine, 'properNodeVersions');

            const { version } = engine.minInstalledSatisfyingVersion('^16');

            expect(version).to.equal(engine.versions[1].version);
            expect(stub.wrappedMethod).not.to.be.undefined;
            stub.reset();
        });
    });
    describe('repositoryEngines()', function() {
        afterEach(mockFS.restore);
        it('should throw RangeError when package not found', function() {
            const wrapper = () => engine.repositoryEngines('missing');

            expect(wrapper).to.throw(RangeError);
        });
        it('should not throw', function() {
            const content = { engines:{ node: '8.11.1' } };
            mockFS({
                myRepo: {
                    'package.json': JSON.stringify(content)
                }
            });

            let result;
            const wrapper = function() {
                result = engine.repositoryEngines('myRepo');
            };

            expect(wrapper).not.to.throw();
            expect(result).to.equal('8.11.1');
        });
        it('should return default there is not a node property', function() {
            const content = { engines:{ yarn: '^1.22.4' } };
            mockFS({
                myRepo: {
                    'package.json': JSON.stringify(content)
                }
            });
            let result;
            expect(result).to.be.undefined;

            const wrapper = function() {
                result = engine.repositoryEngines('myRepo');
            };

            expect(wrapper).not.to.throw();
            expect(result).not.to.be.undefined;

        });
    });
    describe('versionToUseValidator()', function() {
        let satisfyingVersions; let maxInstalledSatisfyingVersion;let versionStringToObject;
        let minInstalledSatisfyingVersion;
        beforeEach(function() {
            sinon.stub(engine, 'properNodeVersions');
        });
        describe('user specified version', function() {
            beforeEach(function() {
                versionStringToObject = sinon.stub(engine, 'versionStringToObject');
                satisfyingVersions = sinon.stub(engine, 'satisfyingVersions');
            });
            it('should throw when specified version is not compatible with target repository', function() {
                sinon.stub(engine, 'repositoryEngines').callsFake(() => '^8.11.1 || ^10.13.0 || ^12.13.0');

                const satVersions = [];
                satisfyingVersions.callsFake(() => satVersions);
                versionStringToObject.callsFake(() => ({ version: '' }));
                const expectedMessage = 'requires NodeJS version(s) \'^8.11.1 || ^10.13.0 || ^12.13.0\' but got \'14.1.1\'';
                const path = '';
                const version = '14.1.1';
                expect(() => engine.versionToUseValidator({ path, version })).to.Throw(RangeError, expectedMessage);
            });
            it('should be v12.13.1', function() {
                sinon.stub(engine, 'repositoryEngines').callsFake(() => '^8.11.1 || ^10.13.0 || ^12.13.0');

                const satVersions = [ { version: 'v12.13.1' }, { version: 'v12.19.1' }, { version: 'v8.11.1' } ];
                satisfyingVersions.callsFake(() => satVersions);
                versionStringToObject.callsFake(() => ({ version: 'v12.13.1' }));
                const expectedVersion = 'v12.13.1';
                const path = '';
                const version = '12.13.1';

                const result = engine.versionToUseValidator({ path, version });

                expect(result.version).to.equal(expectedVersion);
            });
            it('should pick 16.13.0 -- issue 116', function() {
                sinon.stub(engine, 'repositoryEngines').callsFake(() => '^12.13.0 || ^14.15.0 || ^16.13.0');
                const satVersions = [ { version: 'v17.0.1' }, { version: 'v16.13.0' }, { version: 'v16.12.0' }, { version: 'v14.18.1' } ];
                satisfyingVersions.callsFake(() => satVersions);
                versionStringToObject.callsFake(() => ({ version: 'v12.13.1' }));
            });
        });
        describe('default', function() {
            beforeEach(function() {
                maxInstalledSatisfyingVersion = sinon.stub(engine, 'maxInstalledSatisfyingVersion');
                minInstalledSatisfyingVersion = sinon.stub(engine, 'minInstalledSatisfyingVersion');
            });
            it('should throw when version not specified and not installed versions satisfy', function() {
                sinon.stub(engine, 'repositoryEngines').callsFake(() => '^8.11.1 || ^10.13.0 || ^12.13.0');
                maxInstalledSatisfyingVersion.callsFake(() => undefined);
                const expectedMessage = 'repo requires NodeJS version(s) \'^8.11.1 || ^10.13.0 || ^12.13.0\' but no satisfying versions installed!';
                const path = 'projects/repo';

                expect(() => engine.versionToUseValidator({ path })).to.Throw(RangeError, expectedMessage);
            });
            it('should be 12.11.1 when oldest not specified', function() {
                sinon.stub(engine, 'repositoryEngines').callsFake(() => '^8.11.1 || ^10.13.0 || ^12.13.0');
                maxInstalledSatisfyingVersion.callsFake(() => ({ version: 'v12.11.1' }));
                const path = 'projects/repo';

                const result = engine.versionToUseValidator({ path });

                expect(result.version).to.equal('v12.11.1');
            });
            it('should be 12.11.1 when oldest is true', function() {
                sinon.stub(engine, 'repositoryEngines').callsFake(() => '^8.11.1 || ^10.13.0 || ^12.13.0');
                minInstalledSatisfyingVersion.callsFake(() => ({ version: 'v12.11.1' }));
                const path = 'projects/repo';
                const oldest = true;

                const result = engine.versionToUseValidator({ path, oldest });

                expect(result.version).to.equal('v12.11.1');
            });
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

                const { version } = engine.versionStringToObject('2.3.0', versions);

                expect(version).to.equal(versionExpected);
            });
            it('should find major versions', function() {
                const versionExpected = 'v2.3.0';

                const { version } = engine.versionStringToObject('2', versions);

                expect(version).to.equal(versionExpected);
            });
            it('should find major.minor versions', function() {
                const versionExpected = 'v2.2.1';

                const { version } = engine.versionStringToObject('2.2', versions);

                expect(version).to.equal(versionExpected);
            });
            it('should be undefined when not found', function() {
                const result = engine.versionStringToObject('1.2.0', versions);

                expect(result).to.be.undefined;
            });
        });
        describe('oldest is true', function() {
            it('should find full versions', function() {
                const versionExpected = 'v2.3.0';

                const { version } = engine.versionStringToObject('2.3.0', versions, true);

                expect(version).to.equal(versionExpected);
            });
            it('should find major versions', function() {
                const versionExpected = 'v2.0.0';

                const { version } = engine.versionStringToObject('2', versions, true);

                expect(version).to.equal(versionExpected);
            });
            it('should find major.minor versions', function() {
                const versionExpected = 'v2.2.0';

                const { version } = engine.versionStringToObject('2.2', versions, true);

                expect(version).to.equal(versionExpected);
            });
            it('should be undefined when not found', function() {
                const result = engine.versionStringToObject('1.2.0', versions, true);

                expect(result).to.be.undefined;
            });
        });
    });
});
