import assert from 'node:assert/strict';
import {
    beforeEach,
    describe,
    it,
    mock
} from 'node:test';

import { DateTime } from 'luxon';

import {
    filterPeriod,
    processRepo
} from '../../src/grefplus/index.js';
import { options } from '../../src/grefplus/cmdline.js';

describe('grefplus', function () {
    describe('filterPeriod()', function () {
        beforeEach(function () {
            options.fromDate = null;
            options.toDate = null;
        });

        it('should include item when no date range is specified', function () {
            const date = DateTime.fromISO('2026-09-20T12:00:00');

            const result = filterPeriod({ date });

            assert.strictEqual(result, true);
        });

        it('should include item after from-date', function () {
            options.fromDate = DateTime.fromISO('2026-09-20T00:00:00');
            const date = DateTime.fromISO('2026-09-21T12:00:00');

            const result = filterPeriod({ date });

            assert.strictEqual(result, true);
        });

        it('should include item equal to from-date', function () {
            options.fromDate = DateTime.fromISO('2026-09-20T00:00:00');
            const date = DateTime.fromISO('2026-09-20T00:00:00');

            const result = filterPeriod({ date });

            assert.strictEqual(result, true);
        });

        it('should exclude item before from-date', function () {
            options.fromDate = DateTime.fromISO('2026-09-20T00:00:00');
            const date = DateTime.fromISO('2026-09-19T23:59:59');

            const result = filterPeriod({ date });

            assert.strictEqual(result, false);
        });

        it('should include item before to-date', function () {
            options.toDate = DateTime.fromISO('2026-09-20T23:59:59');
            const date = DateTime.fromISO('2026-09-20T12:00:00');

            const result = filterPeriod({ date });

            assert.strictEqual(result, true);
        });

        it('should include item equal to to-date', function () {
            options.toDate = DateTime.fromISO('2026-09-20T23:59:59');
            const date = DateTime.fromISO('2026-09-20T23:59:59');

            const result = filterPeriod({ date });

            assert.strictEqual(result, true);
        });

        it('should exclude item after to-date', function () {
            options.toDate = DateTime.fromISO('2026-09-20T23:59:59');
            const date = DateTime.fromISO('2026-09-21T00:00:00');

            const result = filterPeriod({ date });

            assert.strictEqual(result, false);
        });

        it('should include item within date range', function () {
            options.fromDate = DateTime.fromISO('2026-09-20T00:00:00');
            options.toDate = DateTime.fromISO('2026-09-22T23:59:59');
            const date = DateTime.fromISO('2026-09-21T12:00:00');

            const result = filterPeriod({ date });

            assert.strictEqual(result, true);
        });

        it('should exclude item before date range', function () {
            options.fromDate = DateTime.fromISO('2026-09-20T00:00:00');
            options.toDate = DateTime.fromISO('2026-09-22T23:59:59');
            const date = DateTime.fromISO('2026-09-19T12:00:00');

            const result = filterPeriod({ date });

            assert.strictEqual(result, false);
        });

        it('should exclude item after date range', function () {
            options.fromDate = DateTime.fromISO('2026-09-20T00:00:00');
            options.toDate = DateTime.fromISO('2026-09-22T23:59:59');
            const date = DateTime.fromISO('2026-09-23T12:00:00');

            const result = filterPeriod({ date });

            assert.strictEqual(result, false);
        });
    });
    describe('processRepo()', function () {
        beforeEach(function () {
            options.fromDate = null;
            options.toDate = null;
        });

        it('should parse reflog entries', async function (t) {
            const stdout = [
                'HEAD@{2026-09-20 10:30:00 AM==} abc1234  commit: first +++',
                'HEAD@{2026-09-21 02:15:00 PM==} def5678  commit: second +++'
            ].join('\n');

            const raw = t.mock.fn(async function () {
                return stdout;
            });

            const gitFactory = t.mock.fn(function () {
                return { raw };
            });

            const errors = [];

            const result = await processRepo(
                '/development/my-repo',
                errors,
                gitFactory
            );

            assert.strictEqual(result.length, 2);
            assert.strictEqual(result[0].repo, 'my-repo');
            assert.strictEqual(result[0].body, ' abc1234  commit: first');
            assert.strictEqual(result[1].body, ' def5678  commit: second');
            assert.ok(DateTime.isDateTime(result[0].date));
            assert.strictEqual(
                result[0].date.toFormat('yyyy-MM-dd hh:mm:ss a'),
                '2026-09-20 10:30:00 AM'
            );
            assert.deepStrictEqual(errors, []);
        });

        it('should create git instance for repository', async function (t) {
            const raw = t.mock.fn(async function () {
                return '';
            });

            const gitFactory = t.mock.fn(function () {
                return { raw };
            });

            await processRepo('/development/my-repo', [], gitFactory);

            assert.strictEqual(gitFactory.mock.callCount(), 1);
            assert.deepStrictEqual(
                gitFactory.mock.calls[0].arguments[0],
                {
                    baseDir: '/development/my-repo'
                }
            );
        });

        it('should request reflog from git', async function (t) {
            const raw = t.mock.fn(async function () {
                return '';
            });

            const gitFactory = function () {
                return { raw };
            };

            await processRepo('/development/my-repo', [], gitFactory);

            assert.strictEqual(raw.mock.callCount(), 1);
            assert.deepStrictEqual(
                raw.mock.calls[0].arguments[0],
                [
                    'log',
                    '--walk-reflogs',
                    '--format=%gd %h %d %gs +++',
                    '--date=format:%Y-%m-%d %H:%M:%S %p=='
                ]
            );
        });

        it('should filter entries before from-date', async function () {
            options.fromDate = DateTime.fromISO('2026-09-21T00:00:00');

            const stdout = [
                'HEAD@{2026-09-20 10:30:00 AM==} abc1234  commit: old +++',
                'HEAD@{2026-09-21 02:15:00 PM==} def5678  commit: included +++'
            ].join('\n');

            const gitFactory = function () {
                return {
                    raw: async function () {
                        return stdout;
                    }
                };
            };

            const result = await processRepo(
                '/development/my-repo',
                [],
                gitFactory
            );

            assert.strictEqual(result.length, 1);
            assert.strictEqual(
                result[0].body,
                ' def5678  commit: included'
            );
        });

        it('should return empty array and record git errors', async function () {
            const gitFactory = function () {
                return {
                    raw: async function () {
                        throw new Error('git failed');
                    }
                };
            };

            const errors = [];

            const result = await processRepo(
                '/development/my-repo',
                errors,
                gitFactory
            );

            assert.deepStrictEqual(result, []);
            assert.deepStrictEqual(errors, [
                {
                    repo: '/development/my-repo',
                    error: 'git failed'
                }
            ]);
        });
    });
});