import {
    mkdirSync,
    realpathSync,
    rmSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import {
    basename,
    dirname,
    join
} from 'node:path';
import { v4 as uuid } from 'uuid';

let baseFolder;
let num = 1;

const shortPath = (fullPath) =>
    fullPath
        ? `${basename(dirname(fullPath))}/${basename(fullPath)}`
        : 'Empty';

const createFolder = (pathName) => {
    try {
        mkdirSync(pathName, { recursive: true });

        return pathName;
    }
    catch(error) {
        throw new Error(
            `createFolder threw trying to create:\n ${shortPath(pathName)} \n ${error.message}`
        );
    }
};

const createTempFolder = () => {
    if(!baseFolder) {
        throw new Error('base folder not defined yet');
    }

    const folderPath = join(baseFolder, `${num}`);

    num += 1;

    return createFolder(folderPath);
};

const initBase = () => {
    if(!baseFolder) {
        const temp = realpathSync(tmpdir());

        baseFolder = createFolder(join(temp, uuid()));
    }

    return baseFolder;
};

const destroy = () => {
    if(baseFolder) {
        rmSync(baseFolder, {
            recursive: true,
            force: true
        });

        baseFolder = undefined;
        num = 1;
    }
};

export {
    baseFolder,
    createTempFolder,
    destroy,
    initBase
};