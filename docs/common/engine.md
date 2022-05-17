# Engine

Collection of methods related to NodeJS version detection and handling.

- [Version](#version)
- [Engine check](#engine-check)
- [Installed node versions](#installed-node-versions)
- [Convert a version number string to number](#convert-a-version-number-string-to-number)
- [Locate version object matching a version string](#locate-version-object-matching-a-version-string)
- [Satisfying versions](#satisfying-versions)
- [Most recent satisfying version](#most-recent-satisfying-version)
- [Oldest satisfying version](#oldest-satisfying-version)
- [Repository Engines](#repository-engines)
- [Version to use validator](#version-to-use-validator)


<br><hr>

## Version

Simple class which when given a path & a version at instantiation, will determine the binary name.

Provides getters for:
- version
- path
- bin
- error


## Engine check

Given an optional version range string, it will compare to currently active version and throw if not compatible with version range. If no version string is supplied it will default to `^8.11.1`.

- Will write to log if supplied.
- Will can insert custom message if supplied

Wrapper for [semver.satisfies](https://github.com/npm/node-semver#usage)


## Installed node versions

Obtains names and paths of installed versions sorted descending. Looks for special environmental variables which are dependent on the type of node version manager installed. Excludes any missing _node.exe_ files (windows). Currently only supports NVM for Windows.

- Node Version Manager for Windows: `NVM_HOME`

Returns Array of [Version](#version) objects


## Convert a version number string to number

Used for sorting version numbers.

- v8.1.1 => 80101


## Locate version object matching a version string

Locates most recent (default) or the oldest version string in versions array.

Returns [Version](#version)


## Satisfying versions

Determine which installed versions are compatible with a specified range. Must supply range, array of [Versions](#version), and optionally a boolean if the lower end of range is desired.

Returns an array of [Version](#version) sorted by version descending.


## Most recent satisfying version

Obtains the latest installed node version which is compatible within a given range.

Wrapper for [Satisfying versions](#satisfying-versions).


## Oldest satisfying version

Obtains the oldest installed node version which is compatible within a given range.

Wrapper for [Satisfying versions](#satisfying-versions).


## Repository Engines

Obtains the engines.node property from `package.json` file in specified path. If the property does not exists, returns the default `^8.11.1`. Throws if package file not found.


## Version to use validator

Given a path to a repository. desired version, and optionally a boolean to select the oldest version range, will return the found satisfying [version](#version) or will throw.

Used in command line validation.
