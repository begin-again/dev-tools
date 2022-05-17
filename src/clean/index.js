
const { removeTarget } = require('./clean');
const logger = console;

const builds = /(^[a-z0-9]{32}$)|(^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$)/m;
const yarns = /^yarn--.+/m;

/**
 * hack to allow exported functions to be run from package script
 */
const main = () => {
    switch (process.argv[2]) {
    case '--yarn':
    case '-y':
        removeTarget('Yarn', yarns);
        break;
    case '--builder':
    case '-b':
        removeTarget('Builder', builds);
        break;
    default:
        logger.error(`ERROR: Parameter required: --yarn | --builder`);
    }
};

main();
