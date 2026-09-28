import assert from 'node:assert/strict';
import {
    describe,
    it,
} from 'node:test';

import { DateTime } from 'luxon';

import {
    options,
    setOptions
} from '../../src/grefplus/cmdline.js';

describe('grefplus cmdline', function () {
    it('should configure a single date as the entire day', function () {
        setOptions({
            date: '9/20/26',
            devRoot: [],
            folderNames: []
        });

        assert.ok(DateTime.isDateTime(options.fromDate));
        assert.ok(DateTime.isDateTime(options.toDate));

        assert.strictEqual(
            options.fromDate.toFormat('M/d/yy HH:mm:ss.SSS'),
            '9/20/26 00:00:00.000'
        );

        assert.strictEqual(
            options.toDate.toFormat('M/d/yy HH:mm:ss.SSS'),
            '9/20/26 23:59:59.999'
        );
    });

    it('should configure from-date without to-date', function () {
        setOptions({
            fromDate: '9/20/26',
            devRoot: [],
            folderNames: []
        });

        assert.strictEqual(
            options.fromDate.toFormat('M/d/yy HH:mm:ss.SSS'),
            '9/20/26 00:00:00.000'
        );
        assert.strictEqual(options.toDate, null);
    });

    it('should configure to-date without from-date', function () {
        setOptions({
            toDate: '9/20/26',
            devRoot: [],
            folderNames: []
        });

        assert.strictEqual(options.fromDate, null);
        assert.strictEqual(
            options.toDate.toFormat('M/d/yy HH:mm:ss.SSS'),
            '9/20/26 23:59:59.999'
        );
    });

    it('should configure a date range', function () {
        setOptions({
            fromDate: '9/18/26',
            toDate: '9/20/26',
            devRoot: [],
            folderNames: []
        });

        assert.strictEqual(
            options.fromDate.toFormat('M/d/yy'),
            '9/18/26'
        );
        assert.strictEqual(
            options.toDate.toFormat('M/d/yy'),
            '9/20/26'
        );
    });

    it('should configure dev roots', function () {
        setOptions({
            devRoot: [ '/c/dev', '/d/dev' ],
            folderNames: []
        });

        assert.deepStrictEqual(options.devRoot, [
            '/c/dev',
            '/d/dev'
        ]);
    });

    it('should configure repository folder names', function () {
        setOptions({
            devRoot: [],
            folderNames: [ 'repo-one', 'repo-two' ]
        });

        assert.deepStrictEqual(options.folderNames, [
            'repo-one',
            'repo-two'
        ]);
    });

    it('should default folder names to an empty array', function () {
        setOptions({
            devRoot: []
        });

        assert.deepStrictEqual(options.folderNames, []);
    });

    it('should clear previous date options', function () {
        setOptions({
            date: '9/20/26',
            devRoot: []
        });

        setOptions({
            devRoot: []
        });

        assert.strictEqual(options.fromDate, null);
        assert.strictEqual(options.toDate, null);
    });
});