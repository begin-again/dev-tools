// @ts-check
/**
 * Engine Check
 * @module engines
 */

import semver from 'semver';
import { join, resolve, basename } from 'node:path';
import { readdirSync, accessSync, lstatSync, constants as FSC } from 'node:fs';
import { getPackage } from './repos.mjs';
import { folderExists } from './files.mjs';

const defaultVersion = '16.15.0';

const NumbersPadding = 2;

class Version {
    /**
   * @param {string} version - version name
   * @param {string} path - path to executables folder
   * @param {object} [log] - logger
   * @param {object} [env] - environment variables
   */
    constructor(version, path, log, env) {
        const { NVM_HOME } = (env || process.env);
        this._path = path;
        this._version = version;

        const binName = NVM_HOME ? 'node.exe' : 'node';
        const binPath = join(this._path, binName);
        let logMsg = `engine/version: <${this._version}> `;
        try {
            // executable check doesn't work on windows
            accessSync(binPath, FSC.X_OK);
            this._bin = binPath;
            this._link = lstatSync(this._bin).isSymbolicLink();
            logMsg += `is OK`;
        }
        catch (e) {
            logMsg += `is rejected`;
            if(e.code === 'ENOENT') {
                this._error = `unable to find executable ${binName} for version ${this._version} in ${this._path}`;
            }
            else {
                this._error = `${e.code} : ${e.message}`.trim();
            }
        }
        if(log) {
            log.debug(logMsg);
        }
    }

    /**
   * @readonly
   * @memberof Version
   * @returns {string}
   */
    get error() {
        return this._error;
    }

    /**
   * @readonly
   * @memberof Version
   * @returns {string}
   */
    get path() {
        return this._path;
    }

    /**
   * @readonly
   * @memberof Version
   * @returns {string}
   */
    get version() {
        return this._version;
    }

    /**
   * @readonly
   * @memberof Version
   * @returns {string}
   */
    get bin() {
        return this._bin;
    }

    /**
   * @readonly
   * @memberof Version
   * @returns {boolean}
   */
    get isLink() {
        return this._link;
    }
}

const state = {
    versions: []
};

/**
 * Throws if detected version not within require range
 *
 * @param {string} [requiredVersionRange]
 * @param {object} [log] - logger.level
 * @param {string} [addMsg] - included in log and error message
 * @throws Error
 * @example engineCheck('>=12.13.1', console.error, 'ERROR: ');
 */
const engineCheck = (requiredVersionRange = null, log = null, addMsg = '') => {
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
 * @returns {Number}
 */
const versionStringToNumber = (version) => {
    const _version = version.startsWith('v') ? version.substring(1) : version;
    let _expanded = '';
    _version.split('.').forEach((s, i) => {
        _expanded += i === 0 ? s : s.padStart(NumbersPadding, '0');
    });
    return parseInt(_expanded, 10);
};

/**
 * Locates first or last version string in versions
 *
 * @param {string} v - version number (1.1.1)
 * @param {Version[]} versions - objects
 * @param {boolean} oldest - select oldest version
 * @returns {Version}
 */
const versionStringToObject = (v, versions, oldest = false) => {
    const rx = new RegExp(`^v${v}.*?`);
    const matchingVersions = versions.filter(({ version }) => rx.test(version));
    // versions array is sorted in version descending order
    if(oldest) {
        return matchingVersions[matchingVersions.length - 1];
    }
    return matchingVersions[0];
};

/**
 * Determines which installed versions are compatible with specified range
 *
 * @param {string} requiredVersionRange
  * @param {Function} [pnv] - properNodeVersions
 * @returns {Version[]} satisfying versions sorted descending
 */
const satisfyingVersions = (requiredVersionRange, pnv = properNodeVersions) => {
    const _installed = state.versions.length > 0 ?
        state.versions :
        pnv();
    return _installed
        .filter(
            ({ version, error }) =>
                !error && semver.satisfies(version, requiredVersionRange)
        )
        .sort(
            (a, b) =>
                versionStringToNumber(b.version) -
        versionStringToNumber(a.version)
        );
};

/**
 * Obtains names of installed versions, sorted descending
 * populating engines.versions to Version[]
 *  - NVM_HOME is folder to the version folders
 *  - NVM_BIN is folder of the node executable, The version name is part of the path.
 * @param {object} [log] - standard logger or console
 * @param {{NVM_HOME?:string, NVM_BIN?:string}} [env] - defaults to process.env
 * @returns {Version[]}
 */
// @ts-ignore
const allInstalledNodeVersions = (log, env) => {
    const _env = env || process.env;
    const { NVM_BIN, NVM_HOME } = _env;
    if(NVM_BIN || NVM_HOME) {
        const nodeHome = resolve(NVM_BIN ? join(NVM_BIN, '..', '..') : NVM_HOME);
        if(folderExists(nodeHome)) {
            //  creates an array of Version
            return readdirSync(nodeHome, { withFileTypes:true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name)
                .sort((a, b) => versionStringToNumber(b) - versionStringToNumber(a))
                .map(version => {
                    let path = join(nodeHome, version);
                    if(NVM_BIN) {
                        path = join(path, 'bin');
                    }

                    return new Version(version, path, log);
                });
        }
        return [];
    }
    return [];
};

/**
 * Filters errors from allInstalledNodeVersions
 *   - sets module versions property
 *
 * @param {object} [log] - standard logger or console
 * @param {object=} fakeNvmHome
 * @param {string=} fakeNvmHome.NVM_HOME
 * @param {string=} fakeNvmHome.NVM_BIN
 * @returns {Version[]}
 */
const properNodeVersions = (log, fakeNvmHome = null) => {
    state.versions = allInstalledNodeVersions(log, fakeNvmHome)
        .filter(({ error }) => !error);
    return state.versions;
};

/**
 * Obtains the latest installed node version which is compatible within a given range
 *
 * @param {string} requiredRange
 * @param {Function} [pnv] - properNodeVersions
 * @returns {Version|undefined} version, path, bin
 */
const maxInstalledSatisfyingVersion = (requiredRange, pnv = properNodeVersions) =>
    satisfyingVersions(requiredRange, pnv)[0];

/**
 * Obtains the oldest installed node version which is compatible within a given range
 *
 * @param {string} requiredRange
 * @param {Function} [pnv] - properNodeVersions
 * @returns {Version|undefined} version, path, bin
 */
const minInstalledSatisfyingVersion = (requiredRange, pnv = properNodeVersions) => {
    const version = satisfyingVersions(requiredRange, pnv);
    return version[version.length - 1];
};

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

/**
 *
 * @param {object} param0
 * @param {string} param0.path - to repository
 * @param {string=} param0.version - version number x.y.z
 * @param {boolean=} param0.oldest - choose oldest acceptable version
 * @param {boolean} [noPackage] - path does not have package.json
 * @param {function} [sv] - satisfyingVersions
 * @returns {Version}
 * @throws RangeError
 */
const versionToUseValidator = ({ path, version, oldest }, noPackage, sv) => {
    const properNodeVersions = typeof pnv === 'function' ? pnv : properNodeVersions;
    const satisfyingVersions = typeof sv === 'function' ? sv : satisfyingVersions;
    const repoEngines = noPackage ? version : repositoryEngines(path);
    const repoName = basename(path);

    if(version) {
        const satisfies = satisfyingVersions(repoEngines, properNodeVersions);
        const _version = versionStringToObject(
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
        const _min = minInstalledSatisfyingVersion(repoEngines);
        if(_min) {
            return _min;
        }
    }

    const _max = maxInstalledSatisfyingVersion(repoEngines);
    if(_max) {
        return _max;
    }

    throw new RangeError(
        `${repoName} requires NodeJS version(s) '${repoEngines}' but no satisfying versions installed!`
    );
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
    allInstalledNodeVersions,
    engineCheck,
    properNodeVersions,
    maxInstalledSatisfyingVersion,
    minInstalledSatisfyingVersion,
    repositoryEngines,
    satisfyingVersions,
    semver,
    versionKeys,
    versionStringToObject,
    versionStringToNumber,
    versionToUseValidator,
    state,
    Version
};
