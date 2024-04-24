// @ts-check
/**
 * Engine Check
 * @module engines
 */

import { join, resolve, basename } from 'node:path';
import fs, { readdirSync } from 'node:fs';
import semver from 'semver';
import { getPackage } from './repos.mjs';
import Version from './version.mjs';

const defaultVersion = '16.15.0';

const NumbersPadding = 2;

class Engine {

    /**
     *
     * @param {object} param0
     * @param {object} param0.env
     * @param {string=} param0.env.NVM_BIN
     * @param {string=} param0.env.NVM_HOME
     * @param {string} param0.defaultVersion
     * @param {Version[]} param0.versions
     */
    constructor({ env, defaultVersion, versions }) {
        const _env = env || process.env;
        /** @type {Version[]} */
        this._allVersions = versions || Engine.allInstalledNodeVersions(null, _env);
        /** @type {Version[]} */
        this._versions = this._allVersions.filter(({ error }) => !error);
        this._defaultVersion = defaultVersion || '16.15.0';
    }

    /**
     * All usable detected nodejs versions
     *
     * @readonly
     * @memberof Engine
     */
    get versions() {
        return this._versions;
    }

    /**
     * All detected nodejs versions
     *
     * @readonly
     * @memberof Engine
     */
    get versionsAll() {
        return this._allVersions;
    }

    /**
     * the default version to use
     *
     * @readonly
     * @memberof Engine
     */
    get defaultVersion() {
        return this._defaultVersion;
    }

    /**
     * Obtains names of installed versions, sorted descending
     * populating engines.versions to Version[]
     *  - NVM_HOME is folder to the version folders
     *  - NVM_BIN is folder of the node executable, The version name is part of the path.
     * @param {object} [log] - standard logger or console
     * @param {{NVM_HOME?:string, NVM_BIN?:string}} [env] - defaults to process.env
     * @returns {Version[]}
     * @memberof Engine
     */
    static allInstalledNodeVersions (log, env) {
        const _env = env || process.env;
        const { NVM_BIN, NVM_HOME } = _env;
        if(NVM_BIN || NVM_HOME) {
            const nodeHome = NVM_BIN ? join(NVM_BIN, '..', '..') : NVM_HOME;
            if(fs.existsSync(nodeHome) && fs.statSync(nodeHome).isDirectory()) {
                //  creates an array of Version

                const folders = readdirSync(nodeHome, { withFileTypes:true })
                    .filter(dirent => dirent.isDirectory())
                    .map(dirent => dirent.name)
                    .sort((a, b) => Engine.versionStringToNumber(b) - Engine.versionStringToNumber(a))
                    .map(version => {
                        let path = join(nodeHome, version);
                        if(NVM_BIN) {
                            path = join(path, 'bin');
                        }

                        return new Version(version, path, log);
                    });
                return folders;
            }
            return [];
        }
        return [];
    };

    /**
     * Determines which installed versions are compatible with specified range
     *
     * @param {string} requiredVersionRange
     * @returns {Version[]} satisfying versions sorted descending
     * @memberof Engine
     */
    satisfyingVersions (requiredVersionRange) {
        return this._versions
            .filter(
                ({ version, error }) =>
                    !error && semver.satisfies(version, requiredVersionRange)
            )
            .sort(
                (a, b) =>
                    Engine.versionStringToNumber(b.version) -
                    Engine.versionStringToNumber(a.version)
            );
    };

    /**
     * Obtains the latest installed node version which is compatible within a given range
     *
     * @param {string} requiredRange
     * @returns {Version|undefined} version, path, bin
     * @memberof Engine
     */
    maxInstalledSatisfyingVersion (requiredRange) {
        return this.satisfyingVersions(requiredRange)[0];
    }

    /**
     * Obtains the oldest installed node version which is compatible within a given range
     *
     * @param {string} requiredRange
     * @returns {Version|undefined} version, path, bin
     * @memberof Engine
     */
    minInstalledSatisfyingVersion (requiredRange) {
        const version = this.satisfyingVersions(requiredRange);
        return version[version.length - 1];
    };

    /**
     *
     * @param {object} param0
     * @param {string} param0.path - to repository
     * @param {string=} param0.version - version number x.y.z
     * @param {boolean=} param0.oldest - choose oldest acceptable version
     * @param {boolean} [noPackage] - path does not have package.json
     * @returns {Version}
     * @throws RangeError
     * @memberof Engine
     */
    versionToUseValidator ({ path, version, oldest }, noPackage) {
        const repoEngines = noPackage ? version : repositoryEngines(path);
        const repoName = basename(path);

        if(version) {
            const satisfies = this.satisfyingVersions(repoEngines);
            const _version = Engine.versionStringToObject(
                version,
                satisfies,
                oldest
            );
            // _version is undefined if version is not in satisfies
            const found = satisfies.filter(
                (v) => _version && v.version === _version.version
            )[0];
            if(!found) {
                throw new RangeError(
                    `${repoName} requires NodeJS version(s) '${repoEngines}' but got '${version}'`
                );
            }
            return found;

        }

        if(oldest) {
            const _min = this.minInstalledSatisfyingVersion(repoEngines);
            if(_min) {
                return _min;
            }
        }

        const _max = this.maxInstalledSatisfyingVersion(repoEngines);
        if(_max) {
            return _max;
        }

        throw new RangeError(
            `${repoName} requires NodeJS version(s) '${repoEngines}' but no satisfying versions installed!`
        );
    };

    /**
     * Locates first or last version string in versions
     *
     * @param {string} v - version number (1.1.1)
     * @param {Version[]} versions - objects
     * @param {boolean} oldest - select oldest version
     * @returns {Version}
     * @memberof Engine
     */
    static versionStringToObject (v, versions, oldest = false) {
        const rx = new RegExp(`^v${v}.*?`);
        const matchingVersions = versions.filter(({ version }) => rx.test(version));
        // versions array is sorted in version descending order
        if(oldest) {
            return matchingVersions[matchingVersions.length - 1];
        }
        return matchingVersions[0];
    };

    /**
     * Throws if detected version not within require range
     *
     * @param {string} [requiredVersionRange]
     * @param {object} [log] - logger.level
     * @param {string} [addMsg] - included in log and error message
     * @throws Error
     * @example engineCheck('>=12.13.1', console.error, 'ERROR: ');
     * @memberof Engine
     */
    static engineCheck(requiredVersionRange = null, log = null, addMsg = '') {
        const _requiredVersion = requiredVersionRange || defaultVersion;
        const detectedVersion = semver.clean(process.version);
        if(!semver.satisfies(detectedVersion, _requiredVersion)) {
            const _msg = addMsg ? `( ${addMsg} ) ` : '';
            const msg = `${_msg}detected version ${detectedVersion} but required ${_requiredVersion}`;
            if(log) {
                log(msg);
            }
            throw new Error(`Incompatible NodeJS version: ${msg}`);
        }
    };

    /**
    * converts a version string to number
    *
    * @param {string} version
    * @returns {number}
    * @memberof Engine
    */
    static versionStringToNumber (version) {
        const _version = version.startsWith('v') ? version.substring(1) : version;
        let _expanded = '';
        _version.split('.').forEach((s, i) => {
            _expanded += i === 0 ? s : s.padStart(NumbersPadding, '0');
        });
        return parseInt(_expanded, 10);
    };
    // end of class
}

// TODO: move to common/repos
/**
 * Obtains node engine range
 *
 * @param {string} repoPath - to repository
 * @returns {string} engines | default engine
 * @throws RangeError
 */
const repositoryEngines = (repoPath) => {
    const file = repoPath.endsWith('package.json') ? repoPath : resolve(join(repoPath, 'package.json'));
    const { error, engines } = getPackage(file);
    if(error) {
        throw new RangeError(`package file not found in ${repoPath}`);
    }
    if(engines && engines.node) {
        return engines.node;
    }
    return defaultVersion;
};


const versionKeys = {
    version: {
        describe:
      'specify an already installed NodeJS version. Check \'nvm ls\' to see availability'
        , type: 'string'
        , alias: 'v',
    }
    , oldest: {
        describe: 'choose oldest satisfying NodeJS version'
        , type: 'boolean'
        , default: false
        , alias: 'o',
    },
};


export {
    Engine,
    repositoryEngines,
    versionKeys,
};
