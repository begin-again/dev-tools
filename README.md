# Tools I use in my day job

Only works in Windows with Git For Windows installed. Not WSL.

- [Documentation](docs/index.md)

## setup

Assumption is the all the local clones are in the same folder. For instance, I keep my work in a folder named _projects_ and every clone exists in that folder including this repository. There's a setup script which exits/creates one's bash_profile & bashrc files (with backup). The changes to bashrc are:

1. Creation of a DEVROOT variable pointing to the parent folder where the repositories are kept.
2. A source command to load in this repository's `src/bash.sh`

## testing

The unit tests are required to be run with the latest node engine supported. Run `node src/misc/scripts.js` to obtain the nodejs engines in use.
