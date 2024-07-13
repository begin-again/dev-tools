
import { setOptions, options } from './cmdline.js';
import { allRepoPaths } from '../common/repos.js';
import { branches, report } from './branches.js';
import { hasCommits } from '../common/git.js';

setOptions();

const main = async () => {

    let repos = [];
    if(options.folderNames) {
        repos = allRepoPaths(options.root, options.folderNames);
    }
    else {
        repos = allRepoPaths(options.root);
    }

    if(!options.silent) {
        // eslint-disable-next-line no-console
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



// eslint-disable-next-line no-console
main().catch(console.error);
