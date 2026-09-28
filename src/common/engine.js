/* eslint-disable no-process-env */
/* eslint-disable no-console */

// @ts-check

/**
 * Utilities for discovering installed Node.js versions and selecting a
 * version compatible with a repository's configured Node.js engine.
 *
 * Supports nvm-windows through NVM_HOME and nvm on Linux/macOS through
 * NVM_DIR.
 *
 * @module engine
 */

import { readdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

import semver from 'semver';

import { folderExists } from './files.js';
import { getPackage } from './repos.js';
import Version from './Version.js';

const DEFAULT_VERSION = '12.13.1';
const NUMBERS_PADDING = 2;

const detectedVersion = semver.clean(process.version);

/** @type {Version[]|null} */
let versions = null;

/**
 * Throws when the current Node.js version does not satisfy the required
 * version range.
 *
 * @param {string} [requiredVersionRange] - Required Node.js semver range.
 * @param {Function} [log] - Optional logging function.
 * @param {string} [addMsg] - Additional text included in the error message.
 * @returns {void}
 * @throws {Error} When the current Node.js version is incompatible.
 * @example
 * engineCheck('>=22.0.0', console.error, 'ERROR:');
 */
const engineCheck = (
    requiredVersionRange = DEFAULT_VERSION,
    log = null,
    addMsg = ''
) => {
    if(semver.satisfies(detectedVersion, requiredVersionRange)) {
        return;
    }

    const prefix = addMsg
        ? `( ${addMsg} ) `
        : '';

    const msg =
        `${prefix}detected version ${detectedVersion} ` +
        `but required ${requiredVersionRange}`;

    if(log) {
        log(msg);
    }

    throw new Error(`Incompatible NodeJS version: ${msg}`);
};

/**
 * Converts a semantic version string into a number suitable for sorting.
 *
 * @param {string} version - Node.js version.
 * @returns {number} Numeric representation of the version.
 * @example
 * versionStringToNumber('v22.22.0');
 * // 222200
 */
const versionStringToNumber = (version) => {
    const normalized = version.startsWith('v')
        ? version.substring(1)
        : version;

    const expanded = normalized
        .split('.')
        .map((part, index) =>
            index === 0
                ? part
                : part.padStart(NUMBERS_PADDING, '0')
        )
        .join('');

    return Number.parseInt(expanded, 10);
};

/**
 * Finds an installed Node.js version matching a full or partial version
 * string.
 *
 * The supplied versions are expected to be sorted newest to oldest.
 *
 * @param {string} version - Full or partial Node.js version.
 * @param {Version[]} installedVersions - Installed Node.js versions.
 * @param {boolean} [oldest=false] - Select the oldest matching version.
 * @returns {Version|undefined} Matching installed version.
 */
const versionStringToObject = (
    version,
    installedVersions,
    oldest = false
) => {
    const normalized = version.startsWith('v')
        ? version.substring(1)
        : version;

    const matchingVersions = installedVersions.filter(
        installed => {
            const installedVersion = installed.version.startsWith('v')
                ? installed.version.substring(1)
                : installed.version;

            return installedVersion === normalized ||
                installedVersion.startsWith(`${normalized}.`);
        }
    );

    return oldest
        ? matchingVersions.at(-1)
        : matchingVersions[0];
};

/**
 * Returns installed Node.js versions satisfying a semantic version range.
 *
 * Versions containing validation errors are excluded. Results are sorted
 * newest to oldest.
 *
 * @param {string} requiredVersionRange - Required semantic version range.
 * @param {Version[]} [installedVersions] - Installed Node.js versions.
 * @returns {Version[]} Matching versions sorted newest to oldest.
 */
const satisfyingVersions = (
    requiredVersionRange,
    installedVersions = versions || properNodeVersions()
) =>
    installedVersions
        .filter(({ version, error }) =>
            !error && semver.satisfies(version, requiredVersionRange)
        )
        .toSorted(
            (a, b) =>
                versionStringToNumber(b.version) -
                versionStringToNumber(a.version)
        );

/**
 * Determines the directory containing installed Node.js versions.
 *
 * nvm-windows stores versions directly beneath NVM_HOME:
 *
 *     NVM_HOME/v22.22.0
 *
 * nvm on Linux/macOS stores versions beneath NVM_DIR/versions/node:
 *
 *     NVM_DIR/versions/node/v22.22.0
 *
 * @param {NodeJS.ProcessEnv} env - Environment variables.
 * @returns {string|null} Node.js version root, or null when nvm is unavailable.
 */
const getNvmRoot = (env) => {
    if(process.platform === 'win32') {
        return env.NVM_HOME
            ? resolve(env.NVM_HOME)
            : null;
    }

    return env.NVM_DIR
        ? resolve(env.NVM_DIR, 'versions', 'node')
        : null;
};

/**
 * Obtains all installed Node.js versions known to nvm.
 *
 * Versions are returned even when their Node.js executable is missing or
 * invalid. Those installations contain an error on the resulting Version
 * object and may be filtered with properNodeVersions().
 *
 * Results are sorted newest to oldest.
 *
 * @param {object} [log] - Optional logger.
 * @param {NodeJS.ProcessEnv} [env=process.env] - Environment variables.
 * @returns {Version[]} Installed Node.js versions.
 */
const allInstalledNodeVersions = (
    log,
    env = process.env
) => {
    const root = getNvmRoot(env);

    if(!root || !folderExists(root)) {
        return [];
    }

    return readdirSync(root, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(version => semver.valid(version))
        .sort(
            (a, b) =>
                versionStringToNumber(b) -
                versionStringToNumber(a)
        )
        .map(version =>
            new Version(
                version,
                join(root, version),
                log
            )
        );
};

/**
 * Obtains installed Node.js versions having valid executables.
 *
 * The discovered versions are retained for subsequent version-selection
 * operations.
 *
 * @param {object} [log] - Optional logger.
 * @param {NodeJS.ProcessEnv} [env=process.env] - Environment variables.
 * @returns {Version[]} Valid installed Node.js versions.
 */
const properNodeVersions = (
    log,
    env = process.env
) => {
    versions = allInstalledNodeVersions(log, env)
        .filter(({ error }) => !error);

    return versions;
};

/**
 * Obtains the newest installed Node.js version satisfying a semantic
 * version range.
 *
 * @param {string} requiredRange - Required semantic version range.
 * @param {Version[]} [installedVersions] - Installed Node.js versions.
 * @returns {Version|undefined} Newest matching version.
 */
const maxInstalledSatisfyingVersion = (
    requiredRange,
    installedVersions = versions || properNodeVersions()
) =>
    satisfyingVersions(
        requiredRange,
        installedVersions
    )[0];

/**
 * Obtains the oldest installed Node.js version satisfying a semantic
 * version range.
 *
 * @param {string} requiredRange - Required semantic version range.
 * @param {Version[]} [installedVersions] - Installed Node.js versions.
 * @returns {Version|undefined} Oldest matching version.
 */
const minInstalledSatisfyingVersion = (
    requiredRange,
    installedVersions = versions || properNodeVersions()
) =>
    satisfyingVersions(
        requiredRange,
        installedVersions
    ).at(-1);

/**
 * Obtains the required Node.js engine range for a repository.
 *
 * DEFAULT_VERSION is returned when package.json does not specify
 * engines.node.
 *
 * @param {string} repoPath - Repository directory or package.json path.
 * @returns {Promise<string>} Required Node.js version range.
 * @throws {RangeError} When package.json cannot be found.
 */
const repositoryEngines = async (repoPath) => {
    const file = repoPath.endsWith('package.json')
        ? repoPath
        : resolve(repoPath, 'package.json');

    const { error, engines } = await getPackage(file);

    if(error) {
        throw new RangeError(
            `package file not found in ${repoPath}`
        );
    }

    return engines?.node || DEFAULT_VERSION;
};

/**
 * Determines which installed Node.js version should be used.
 *
 * When a version is explicitly supplied, that version must satisfy the
 * repository's configured Node.js engine range.
 *
 * Otherwise, the newest satisfying version is selected unless oldest is
 * true.
 *
 * @param {object} options - Version selection options.
 * @param {string} options.path - Repository path.
 * @param {string} [options.version] - Requested Node.js version.
 * @param {boolean} [options.oldest=false] - Select the oldest match.
 * @param {boolean} [noPackage=false] - Treat version as the required range.
 * @returns {Promise<Version>} Selected installed Node.js version.
 * @throws {RangeError} When no compatible installed version exists.
 */
const versionToUseValidator = async (
    { path, version, oldest },
    noPackage = false
) => {
    const requiredRange = noPackage
        ? version
        : await repositoryEngines(path);

    const repoName = basename(path);
    const installedVersions = versions || properNodeVersions();

    const matchingVersions = satisfyingVersions(
        requiredRange,
        installedVersions
    );

    if(version) {
        const requested = versionStringToObject(
            version,
            matchingVersions,
            oldest
        );

        if(!requested) {
            throw new RangeError(
                `${repoName} requires NodeJS version(s) ` +
                `'${requiredRange}' but got '${version}'`
            );
        }

        return requested;
    }

    const selected = oldest
        ? matchingVersions.at(-1)
        : matchingVersions[0];

    if(selected) {
        return selected;
    }

    throw new RangeError(
        `${repoName} requires NodeJS version(s) ` +
        `'${requiredRange}' but no satisfying versions installed!`
    );
};

/**
 * Shared yargs options for commands accepting a Node.js version.
 *
 * @type {object}
 */
const versionKeys = {
    version: {
        describe:
            'specify an already installed NodeJS version. ' +
            'Check \'nvm ls\' to see availability',
        type: 'string',
        alias: 'v'
    },
    oldest: {
        describe: 'choose oldest satisfying NodeJS version',
        type: 'boolean',
        default: false,
        alias: 'o'
    }
};

export {
    allInstalledNodeVersions,
    engineCheck,
    maxInstalledSatisfyingVersion,
    minInstalledSatisfyingVersion,
    properNodeVersions,
    repositoryEngines,
    satisfyingVersions,
    versionKeys,
    versionStringToNumber,
    versionStringToObject,
    versionToUseValidator
};