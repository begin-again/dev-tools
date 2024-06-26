import { lstatSync, accessSync, constants } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';


/**
 *
 * @param {object} param0
 * @param {string} param0.version
 * @param {string=} param0.path
 * @param {object=} param0.env
 * @returns {import('../../types/index').Version}
 */
function createVersion({ version, path, env }) {
    const versionInstance = {};
    const { NVM_HOME, NVM_BIN } = (env || process.env);
    let _path;
    let _error;
    let _bin;
    let _link;
    if(!path && NVM_BIN) {
        _path = resolve(`${NVM_BIN}/../../${version}/bin`);
    }
    else if(!path && NVM_HOME) {
        _path = resolve(`${NVM_HOME}/${version}`);
    }
    else {
        let _expandedPath;
        if(path.startsWith('~')) {
            _expandedPath = join(homedir(), path.slice(1));
            _path = resolve(_expandedPath);
        }
        else {
            _path = resolve(path);
        }
    }
    const _version = version;

    const binName = NVM_HOME ? 'node.exe' : 'node';
    const binPath = resolve(join(_path, binName));
    try {
        const flags = NVM_HOME ? constants.F_OK : constants.F_OK | constants.X_OK;
        accessSync(binPath, flags);
        _bin = binPath;
        _link = lstatSync(_bin).isSymbolicLink();
    }
    catch (e) {
        if(e.code === 'ENOENT') {
            _error = `unable to find executable ${binName} for version ${_version} in ${_path}`;
        }
        else {
            _error = `${e.code} : ${e.message}`.trim();
        }
    }

    // Define getters
    Object.defineProperties(versionInstance, {
        error: {
            get() {
                return _error;
            }
            , enumerable: true
        }
        , path: {
            get() {
                return _path;
            }
            , enumerable: true
        }
        , version: {
            get() {
                return _version;
            }
            , enumerable: true
        }
        , bin: {
            get() {
                return _bin;
            }
            , enumerable: true
        }
        , isLink: {
            get() {
                return _link;
            }
            , enumerable: true
        }
    });

    // @ts-ignore
    return versionInstance;
}

export default createVersion;