import { platform } from 'node:os';
import { sep } from 'node:path';
import mockFS from 'mock-fs';
import fs from 'node:fs';
import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from '../node_modules/sinon-chai-es/lib/sinon-chai.mjs';
chai.use(sinonChai);
const isWindows = platform() === 'win32';

import { Engine } from '../src/common/engine.mjs';

// eslint-disable-next-line no-unused-vars
import Version from '../src/common/version.mjs';

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
                const engine = new Engine({
                    env: { NVM_HOME: 'nvm' }
                });
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
        it('should not throw when compatible');
        it('should throw on incompatible engines');
        it('should write to log');
        it('should write to log with additional message');
    });
    describe('maxInstalledSatisfyingVersion()', function() {
        it('should be undefined when not satisfied');
        it('should be versions');
        it('should be versions largest matching version');
    });
    describe('minInstalledSatisfyingVersion()', function() {
        it('should be versions');
        it('should be versions oldest matching version');
        it('should allow matching on major versions');
        it('should pick 16.12.0 -- issue 116');
    });
});
