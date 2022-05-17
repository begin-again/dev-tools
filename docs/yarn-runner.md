# Yarn Runner

This is small wrapper for yarn that allows one to launch yarn utilizing a version of yarn which is not currently active and where the current working directory is not necessarily the directory for yarn to operate on.

## How it works

Launches yarn in a new shell where:
- the path variable is modified to have the path to then desired BodeJS version occur before active NodeJS version
- the current working directory is set to the specified path, defaulting to current working directory.
- the node version is selected from those installed that work in the repository found in the specified path. [See Engine](common/engine.md#most-recent-satisfying-version)

Use the alias `yn` to launch the tool The default command is _install_.

Any option passed after `--` is sent directly to yarn.

| Yarn command           | yn command                                    |
| :--------------------- | :-------------------------------------------- |
| `yarn install`         | `yn` or `yn -c install`                       |
| `yarn install --force` | `yn -- --force` or `yn -c install -- --force` |
| `yarn audit --json`    | `yn -c audit -- --json`                       |
| `yarn add lodash`      | `yn -c add -- lodash`                         |


Specify version of NodeJS to use by including `-v <version number>` before to the `--` (if present). The engine module will throw an error if the specified version is not installed or is not compatible with the repository.
