/* eslint-disable no-magic-numbers */
const chai = require('chai');
const { expect } = chai;

const mockFS = require('mock-fs');
const fs = require('fs');
const { Version } = require('../common/engine.js');
const sinon = require('sinon');
chai.use(require('sinon-chai'));
const { platform } = require('os');
const isWindows = platform() === 'win32';

const clean = require('./clean.js');
const report = require('./report.js');
const fix = require('./fix.js');
const remove = require('./remove.js');

let version10; let version12; let version14; let logger = {};


describe('node-tools', function() {
    afterEach(mockFS.restore);
    beforeEach(function() {
        mockFS({
            a: {
                'v10.0.0': {
                    'node64.exe':'content'
                    , 'node.exe': mockFS.symlink({ path: 'node64.exe' })
                }
                , 'v12.0.0': {
                    'node64.exe': 'content'
                    , 'node.exe': 'content'
                }
                , 'v14.0.0': {
                    'node64.exe': 'content64'
                }
            }
        });
        version10 = new Version('v10.0.0', 'a/v10.0.0');
        version12 = new Version('v12.0.0', 'a/v12.0.0');
        version14 = new Version('v14.0.0', 'a/v14.0.0');
        logger = {
            debug: sinon.spy()
            , error: sinon.spy()
        };
    });
    describe('clean', function() {
        it('should remove only the symbolic links', (done) => {
            const installed = [
                version10
                , version12
            ];

            expect(fs.readdirSync('a/v10.0.0')).contains('node.exe');
            expect(fs.readdirSync('a/v12.0.0')).contains('node.exe');

            clean({ installed }, logger);
            done();

            expect(fs.readdirSync('a/v10.0.0')).not.contains('node.exe');
            expect(fs.readdirSync('a/v12.0.0')).contains('node.exe');

        });
        it('should report only on dryRun', (done) => {
            const dryRun = true;
            const installed = [
                version10
                , version12
            ];

            expect(fs.readdirSync('a/v10.0.0')).contains('node.exe');
            expect(fs.readdirSync('a/v12.0.0')).contains('node.exe');

            clean({ installed, dryRun }, logger);
            done();

            expect(fs.readdirSync('a/v10.0.0')).contains('node.exe');
            expect(fs.readdirSync('a/v12.0.0')).contains('node.exe');
        });
    });
    describe('report', function() {
        it('should report findings', (done) => {
            const ExpectedCallCount = 4;
            const installed = [
                version10
                , version12
                , version14
            ];

            report({ installed }, logger);
            done();

            expect(logger.debug.firstCall.firstArg).equals(' - v10.0.0   - OK (link)');
            expect(logger.debug.secondCall.firstArg).equals(' - v12.0.0   - OK ');
            expect(logger.debug.thirdCall.firstArg).equals(' - v14.0.0   - Problem: \'node.exe\' not found or executable');
            expect(logger.debug.callCount).equals(ExpectedCallCount);
        });
    });
    describe('fix', function() {
        it('should create a symbolic link', function() {
            if(!isWindows) {
                return this.skip();
            }
            const installed = [
                version10
                , version12
                , version14
            ];
            const execute = true;

            expect(fs.readdirSync('a/v10.0.0')).contains('node.exe');
            expect(fs.readdirSync('a/v12.0.0')).contains('node.exe');
            expect(fs.readdirSync('a/v14.0.0')).not.contains('node.exe');

            fix({ installed, execute, mode: 'link' }, logger);

            expect(fs.readdirSync('a/v10.0.0')).contains('node.exe');
            expect(fs.readdirSync('a/v12.0.0')).contains('node.exe');
            expect(fs.readdirSync('a/v14.0.0')).contains('node.exe');
            expect(fs.lstatSync('a/v14.0.0/node.exe').isSymbolicLink()).is.true;
        });
        it('should create copy of node64.exe', function() {
            if(!isWindows) {
                return this.skip();
            }
            const installed = [
                version10
                , version12
                , version14
            ];
            const execute = true;

            expect(fs.readdirSync('a/v10.0.0')).contains('node.exe');
            expect(fs.readdirSync('a/v12.0.0')).contains('node.exe');
            expect(fs.readdirSync('a/v14.0.0')).not.contains('node.exe');

            fix({ installed, execute, mode: 'copy' }, logger);

            const content = fs.readFileSync('a/v14.0.0/node.exe', { encoding: 'utf-8' });

            expect(fs.readdirSync('a/v10.0.0')).contains('node.exe');
            expect(fs.readdirSync('a/v12.0.0')).contains('node.exe');
            expect(fs.readdirSync('a/v14.0.0')).contains('node.exe');
            expect(fs.lstatSync('a/v14.0.0/node.exe').isSymbolicLink()).is.false;
            expect(content).equals('content64');
        });
    });
    describe('remove', function() {
        it('should not remove when execute is false', async function() {
            const installed = [ version10, version12 ];
            const version = '10.0.0';

            await remove({ installed, execute: false, version }, logger);

            expect(fs.readdirSync('a')).contains('v10.0.0');
            expect(fs.readdirSync('a')).contains('v12.0.0');
            expect(logger.debug.callCount).equals(1);
        });
        it('should report but not remove matched range when execute is false', async function() {
            const installed = [ version10, version12 ];
            const version = '10.0.0';

            await remove({ installed, execute: false, version }, logger);

            expect(fs.readdirSync('a')).contains('v10.0.0');
            expect(fs.readdirSync('a')).contains('v12.0.0');
            expect(logger.debug.callCount).equals(1);
            expect(logger.debug.firstCall.firstArg).matches(/^Would remove/);
        });
        it('should remove only matched range when execute is true', async function() {
            const installed = [ version10, version12 ];
            const version = '10.0.0';

            await remove({ installed, execute: true, version }, logger);

            expect(fs.readdirSync('a')).not.contains('v10.0.0');
            expect(fs.readdirSync('a')).contains('v12.0.0');
            expect(logger.debug.callCount).equals(1);
            expect(logger.debug.firstCall.firstArg).matches(/^Removed/);
        });
        it('should report message when no installed versions match range', async function() {
            const installed = [ version10, version12 ];
            const version = '5.0.0';

            await remove({ installed, execute: false, version }, logger);

            expect(fs.readdirSync('a')).contains('v10.0.0');
            expect(fs.readdirSync('a')).contains('v12.0.0');
            expect(logger.debug.callCount).equals(1);
            expect(logger.debug.firstCall.firstArg).matches(/^No matches found for/);
        });
    });
});
