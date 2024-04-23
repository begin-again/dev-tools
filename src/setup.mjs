/**
 * Bash Installer
 * Install the bash files for those who
 * do not already know how to configure their own bash files.
 */

import { type as osType } from 'node:os';
import path from 'node:path';
import shell from 'shelljs';

const winSep = new RegExp(/\\/g);
const dedupeSep = new RegExp(/\/\//g);
const posixSep = '/';
const now = Date.now();

shell.config.silent = true;

const home = {
     
    user: process.env.HOME
        .replace(winSep, posixSep)
        .replace(dedupeSep, posixSep)
    , projects: path
        // devroot derived from parent folder of this repo
        .dirname(process.cwd())
        .replace(winSep, posixSep)
        .replace(dedupeSep, posixSep)
    , tools: process.cwd()
        .replace(winSep, posixSep)
        .replace(dedupeSep, posixSep)
};
const bash = {
    tools: `${home.tools}/dev-tools/src/bash.sh`
    , home: `${home.user}/.bashrc`
};
const profile = {
    home: `${home.user}/.bash_profile`
};
const login = {
    home: `${home.user}/.bash_login`
};

if(!shell.which('bash')) {
    process.stdout.write('Sorry, this script requires Bash shell\n');
    process.exitCode = 1;
    throw new Error('no bash');
}
shell.config.shell = shell.which('bash');

// bashrc
shell.mv(bash.home, `${bash.home}_dev_tools_${now}.bak`);

shell.touch(bash.home);
shell.echo('echo \'loading ~/.bashrc\'\n').toEnd(bash.home);
shell.echo('\n# dev-tools - start').toEnd(bash.home);
shell.echo(`export DEVROOT='${home.projects}'`).toEnd(bash.home);
shell.echo(`source '${bash.tools}'`).toEnd(bash.home);
shell.echo('# dev-tools - end\n').toEnd(bash.home);
shell.echo('\n# Personal additions and over-rides\n').toEnd(bash.home);

// Over-ride some settings based on OS
if(osType === 'Darwin') {
    shell.echo('unalias find').toEnd(bash.home);
}

// bash_profile
shell.mv(profile.home, `${profile.home}_dev_tools_${now}.bak`);
shell.touch(profile.home);
shell.echo(`source ${bash.home}`).toEnd(profile.home);

// bash_login
shell.mv(login.home, `${login.home}_dev_tools_${now}.bak`);
shell.touch(login.home);
shell.echo(`source ${bash.home}`).toEnd(login.home);

shell.echo('Done - open new shell. You should see a new command prompt');
