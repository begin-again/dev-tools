/* eslint-disable no-process-env */
/* eslint-disable no-console */
// @ts-check
/**
 * Engine Check
 * @module engines
 */

const semver = require('semver');
const defaultVersion = '12.13.1';
const detectedVersion = semver.clean(process.version);
const { join, resolve, basename } = require('path');
const {
    readdirSync,
    accessSync,
    lstatSync,
    constants: FSC,
} = require('fs');
const { getPackage } = require('./repos.js');
const { folderExists } = require('./files');

class Version {
    /**
    * @param {String} version - version name
    * @param {String} path - path to executables folder
    * @param {Object} [log] - logger
    * @param {Object} [env] - environment variables
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
    * @returns {String}
    */
    get error() {
        return this._error;
    }

    /**
    * @readonly
    * @memberof Version
    * @returns {String}
    */
    get path() {
        return this._path;
    }

    /**
    * @readonly
    * @memberof Version
    * @returns {{version:string, major:number, minor:number, path:number}} - version object
    */
    get version() {
        return this._version;
    }

    /**
    * @readonly
    * @memberof Version
    * @returns {String}
    */
    get bin() {
        return this._bin;
    }

    /**
    * @readonly
    * @memberof Version
    * @returns {Boolean}
    */
    get isLink() {
        return this._link;
    }

}

/**
 * Throws if detected version not within require range
 *
 * @param {String} [requiredVersionRange]
 * @param {Object} [log] - logger.level
 * @param {String} [addMsg] - included in log and error message
 * @throws Error
 * @example engineCheck('>=12.13.1', console.error, 'ERROR: ');
 */
const engineCheck = (requiredVersionRange = null, log = null, addMsg = '') => {
    const _requiredVersion = requiredVersionRange || defaultVersion;
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
 * Locates first or last version string in versions
 *
 * @param {String} v - version number (v1.1.1)
 * @param {Version[]} versions - objects
 * @param {Boolean=} oldest - select oldest version
 * @returns {Version}
 */
const versionStringToObject = (v, versions, oldest = false) => {
    const rx = new RegExp(`^v${v}.*?`);
    const sortMethod = oldest ? 'compare' : 'rcompare';
    const matchingVersions = versions
        .filter(({ version }) => rx.test(version))
        .sort((a, b) => semver[sortMethod](a.version, b.version));
    return matchingVersions[0];
};

/**
 * Determines which installed versions are compatible with specified range
 *
 * @param {String} requiredVersionRange
 * @param {boolean=} descendingOrder - sort descending
 * @returns {Version[]} satisfying versions sorted descending
 */
const satisfyingVersions = (requiredVersionRange, descendingOrder = true) => {
    const _installed =
    module.exports.versions || module.exports.properNodeVersions();
    const sortingMethod = descendingOrder ? 'rcompare' : 'compare';
    return _installed
        .filter(
            ({ version, error }) =>
                !error && semver.satisfies(version, requiredVersionRange)
        )
        .sort((a, b) => semver[sortingMethod](a.version, b.version));
};

/**
 * Obtains names of installed versions, sorted descending
 * populating engines.versions to Version[]
 *  - NVM_HOME is folder to the version folders
 *  - NVM_BIN is folder of the node executable, The version name is part of the path.
 * @param {Object} [log] - standard logger or console
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
                .sort(semver.rcompare)
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
 * @param {Object} [log] - standard logger or console
 * @param {object=} fakeNvmHome
 * @param {string=} fakeNvmHome.NVM_HOME
 * @param {string=} fakeNvmHome.NVM_BIN
 * @returns {Version[]}
 */
const properNodeVersions = (log, fakeNvmHome = null) => {
    module.exports.versions = module.exports
        .allInstalledNodeVersions(log, fakeNvmHome)
        .filter(({ error }) => !error);
    return module.exports.versions;
};

/**
 * Obtains the latest installed node version which is compatible within a given range
 *
 * @param {String} requiredRange
 * @returns {Version|undefined} version, path, bin
 */
const maxInstalledSatisfyingVersion = (requiredRange) =>
    module.exports.satisfyingVersions(requiredRange)[0];

/**
 * Obtains the oldest installed node version which is compatible within a given range
 *
 * @param {String} requiredRange
 * @returns {Version|undefined} version, path, bin
 */
const minInstalledSatisfyingVersion = (requiredRange) =>
    module.exports.satisfyingVersions(requiredRange, false)[0];

/**
 * Obtains node engine range
 *
 * @param {String} repoPath - to repository
 * @returns {String} engines | default engine
 * @throws RangeError
 */
const repositoryEngines = (repoPath) => {
    const file = repoPath.endsWith('package.json') ? repoPath : join(repoPath, 'package.json');
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
 * @param {Object} param0
 * @param {String} param0.path - to repository
 * @param {String=} param0.version - version number x.y.z
 * @param {Boolean=} param0.oldest - choose oldest acceptable version
 * @param {Boolean=} param0.force - choose specified version even if not in range
 * @param {Boolean=} noPackage - path does not have package.json
 * @returns {Version}
 * @throws RangeError
 */
const versionToUseValidator = ({ path, version, oldest, force }, noPackage) => {
    let repoEngines;
    if(noPackage) {
        repoEngines = version;
    }
    else {
        repoEngines = module.exports.repositoryEngines(path);
    }
    const repoName = basename(path);

    if(version) {
        const engineRange = force ? version : repoEngines;
        const satisfies = module.exports.satisfyingVersions(engineRange);
        const _version = module.exports.versionStringToObject(
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
        const _min = module.exports.minInstalledSatisfyingVersion(repoEngines);
        if(_min) {
            return _min;
        }
    }

    const _max = module.exports.maxInstalledSatisfyingVersion(repoEngines);
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

module.exports = {
    allInstalledNodeVersions
    , engineCheck
    , properNodeVersions
    , maxInstalledSatisfyingVersion
    , minInstalledSatisfyingVersion
    , repositoryEngines
    , satisfyingVersions
    , versionKeys
    , versionStringToObject
    , versionToUseValidator
    , Version
};
