
require('./cmdline').setOptions();
const { options } = require('./cmdline');
const { allRepoPaths } = require('../common/repos');
const { branches, report } = require('./branches');
const { hasCommits } = require('../common/git');

const main = async () => {

    let repos = [];
    if(options.folderNames) {
        repos = allRepoPaths(options.root, options.folderNames);
    }
    else {
        repos = allRepoPaths(options.root);
    }

    // eslint-disable-next-line no-console
    if(!options.silent) {
        console.log(`Processing ${repos.length} repositories in ${options.root}`);
    }

    Promise.all(repos.map(hasCommits))
        .then(results => {
            const branchReports = results
                .filter(repo => !repo.error)
                .map(({ repo }) => repo)
                .map(branches);

            return Promise.all(branchReports)
                .then(br => {
                    return report(br);
                })
                .catch(err => {
                    // eslint-disable-next-line no-console
                    console.error('main threw error', `${err.message} | ${err.cmd}`);
                    process.exitCode = 1;
                    throw err;
                });
        })
        .then((reports) => {
            reports.forEach(line => {
                // eslint-disable-next-line no-console
                console.log(line);
            });
        });
};

main();
