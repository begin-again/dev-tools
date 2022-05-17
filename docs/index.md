# Shell tooling

 :collision: All tools are compatible with the lowest version specified in it's package file.

- [Common](#common)
- [Clean Temporary Folder](#clean-temporary-folder)
- [Branch status](#branch-status)
- [Changed files](#changed-files)
- [Global git activity](#global-git-activity)
- [Local git activity](#local-git-activity)
- [Merge conflicts](#merge-conflicts)
- [Quick temporary commit](#quick-temporary-commit)
- [Remove changes](#remove-changes)
- [Simple log](#simple-log)
- [Resource](#resource)
- [Yarn Runner](#yarn-runner)
- [Common Modules](#common-modules)
- [Node Tools](#node-tools)

## Common

[To Common Index](./common/index.md)

## Clean Temporary Folder

Identifies and deletes folders matching known patterns. These include folders produced by `yarn` and `deploy-builder`. This really only impacts Windows because that O/S has no built in support for pruning the temporary folder.

Usage:<br/>
 - `clean -y |--yarn`, remove yarn folders.
 - `clean -b | --builder`, remove builder folders. This can be slow if there are number of these folders and not empty.

<details>
    <summary>Examples</summary>
<blockquote>
<pre>
$ clean -y
[12:07:35] Yarn cleanup started on C:\Users\SomeUser~1\AppData\Local\Temp
[12:07:35] attempting to delete 37 folders - please be patient
[12:07:35] Yarn cleanup completed
1604 $ clean -b
[12:08:09] Builder cleanup started on C:\Users\SomeUser~1\AppData\Local\Temp
[12:08:09] attempting to delete 375 folders - plea se be patient
[12:08:10] Builder cleanup completed
</pre>
</blockquote>
</details>

## Branch status

command: `branches`

Lists the checked out branches of all git repositories (which have commits) found within the development root. Does not look into sub-folders. Using the `--fetch` option will first fetch remotes from origin and thus will be slower. The `--help` or `-h` option will show usage information.

You are encouraged to create your own aliases to show specific repositories.
- Piping to `column` can make it easier to read (`branches -sd | column -ts "|"`)
- Use grep to find dirty or out of date repositories `branches -sdf | grep -E "ahead|\*"`

<details>
    <summary>Examples</summary>
    <blockquote>
        <pre>
        $ branches -n connect onestop
        Processing 2 repositories in C:/Users/some-user/projects
        connect | master | 66bc179
        onestop | master | ee1e953
        $ branches -n connect onestop -f
        Processing 2 repositories in C:/Users/some-user/projects
        connect | master | 66bc179
        onestop | master | ee1e953 | ahead 0 : behind 1
        </pre>
    </blockquote>
</details>

## Changed files

command: `changed`

Shows the files which have changed between current branch and named branch which defaults to master.

:balloon: Output is pipe-able to console applications such as `grep`.

<details>
    <summary>Example</summary>
    <blockquote>
        <pre>
        $ changed
        .eslintrc
        .gitattributes
        .gitignore
        package.json
        </pre>
    </blockquote>
</details>

## Global git activity

command: `grefp`

Shows the git reference logs sorted by date of action all git repositories found in the immediate DEVROOT. This will show what you've been doing in the repository since last garbage collection. Run `grefp --help` for usage. You are encouraged to create aliases targeting frequently used repositories.

:balloon: Output is pipe-able to console applications such as `grep`.

<details>
    <summary>Example</summary>
    <blockquote>
        <pre>
        $ grefp -n repo1 repo2 repo3 -f 11/4/19 -t 11/5/19
        ...
        2020-11-19 03:52 PM  repo1    52a548f  checkout: moving from fix-admin-menu-button to xx/setup-2021
        2020-11-19 05:16 PM  repo2    5c04d57  checkout: moving from master to xx/remove-tests
        2020-11-20 09:56 AM  repo3    766cbd2  commit: fix something not displaying in edit form
        2020-11-20 10:38 AM  repo2    c389d74  checkout: moving from xx/remove-tests to master
        2020-11-20 10:40 AM  repo2    5c04d57  checkout: moving from master to xx/remove-tests
        2020-11-20 10:45 AM  repo2    77200c2  commit (merge): master sync
        2020-11-20 10:48 AM  repo2    98648f7  (xx/remove-tests) commit: sync lock
        2020-11-20 11:41 AM  repo2    c389d74  checkout: moving from xx/remove-tests to master
        </pre>
    </blockquote>
</details>

## Local git activity

command: `gref`

Shows the git reference logs sorted by date of action for current or specified folder name relative to DEVROOT. This will show what you've been doing in the repository since last garbage collection.

:balloon: Output is pipe-able to console applications such as `grep`.

<details>
    <summary>Examples</summary>
    <blockquote>
        <pre>
        $ gref
        HEAD@{26 Nov 10:19} 4d875c2 26 Nov 10:19 (HEAD -> dev-tools) commit: add alias for branches add alias for branches
        HEAD@{26 Nov 10:17} e4c057f 26 Nov 10:17 (origin/dev-tools) commit: added current branches added current branches
        HEAD@{21 Nov 16:59} c653d10 21 Nov 16:59 commit: added gref-plus and clean added gref-plus and clean
        HEAD@{21 Nov 16:58} 10f494e 28 Aug 11:47 (origin/master, origin/HEAD, master) reset: moving to head~3 simpler config
        $ gref repo1
        HEAD@{22 Nov 09:39} 2554e18 22 Nov 09:39 (HEAD -> xx/fix-yarn-lock, origin/xx/fix-yarn-lock) commit: lock file not current on master lock file not current on master
        HEAD@{22 Nov 09:36} 17d359f 18 Nov 11:31 (origin/master, merged, master) checkout: moving from master to xx/fix-yarn-lock Update app grid after logging recent app (#666)
        HEAD@{22 Nov 09:35} 17d359f 18 Nov 11:31 (origin/master, merged, master) reset: moving to HEAD Update app grid after logging recent app (#666)
        </pre>
    </blockquote>
</details>


## Merge conflicts

command: `checkmerge`

Runs a merge with the `--no-commit` option which lets one see if there will be conflicts.


## Quick temporary commit

command: `gtemp`

Used for when one needs to switch branches but already has many changes that one doesn't want to stash or lose. When returning to the branch, simply perform reset `git reset head~1` to resume.

:hand: This command does not commit untracked files.

<details>
    <summary>Examples</summary>
    <blockquote>
        <pre>
            $ git status
            # On branch dev-tools
            # Changes not staged for commit:
            #   (use "git add <file>..." to update what will be committed)
            #   (use "git restore <file>..." to discard changes in working directory)
            #       modified:   README.md
            #       modified:   dev-tools/alias.sh
            #       modified:   dev-tools/functions.sh
            #
            no changes added to commit (use "git add" and/or "git commit -a")
            $ gtemp
            [dev-tools 77ad968] temp
            3 files changed, 147 insertions(+), 43 deletions(-)
            $ git log --oneline -1
            77ad968 (HEAD -> dev-tools) temp
        </pre>
    </blockquote>
</details>


## Remove changes

command: `gclean`

Cleans the working directory, removing all uncommitted changes including untracked files.

<details>
    <summary>Examples</summary>
    <blockquote>
        <pre>
            $ git status
            # On branch test
            # Changes not staged for commit:
            #   (use "git add <file>..." to update what will be committed)
            #   (use "git restore <file>..." to discard changes in working directory)
            #       modified:   README.md
            #
            # Untracked files:
            #   (use "git add <file>..." to include in what will be committed)
            #       foo
            #
            no changes added to commit (use "git add" and/or "git commit -a")
            $ gclean
            Removing foo
            # On branch test
            nothing to commit, working tree clean
            $ git status
            # On branch test
            nothing to commit, working tree clean
        </pre>
    </blockquote>
</details>


## Simple log

command: `gl <entries> <branch>`

Easier to read log for when one doesn't need to see more than the title of a commit. The entries and branch are optional but the order applied is not.

:balloon: Output is pipe-able to console applications such as `grep`.

<details>
    <summary>Examples</summary>
    <blockquote>
        <pre>
            $ gl 3 master
            536b5fa 11-26-19 11:42    Some Guy      lock file not current on master (#669)
            17d359f 11-18-19 11:31    Some Guy      Update app grid after logging recent app (#666)
            a670ead 11-12-19 08:55    Some Guy      add hook info to docs (#659)

            $ gl | grep grid | column -ts "|"
            17d359f 11-18-19 11:31    Some Guy      Update app grid after logging recent app (#666)
            a6ad41f 08-08-18 11:11    Another Guy   Fix Large gap between announcements and app-grid when no favorites (#327)
            7680c9f 06-22-18 08:09    Another Guy   Chips added to App-grid (#306)
            2cf732b 03-05-18 09:35    Some Guy      connectHttpService: added check for recordcount when json format is grid (#173)
            bbe6021 02-05-18 10:26    Another Guy   Update appframe, application loading, and responsive grid changes (#114)
            79f1f4f 12-01-17 14:31    Another Guy   App-grid App Launch Fix (#81)
            7c04bd5 09-19-17 14:52    JDOE          Structure: created constant portalConfig in app.module.js and used it in app-grid's component's template
        </pre>
    </blockquote>
</details>


## Resource

Re-loads the bash configuration file `.bashrc` for the current shell. This prevents one having to restart an open shell to pick up changes in configuration files.


## Yarn Runner

command: `yn`

Runs yarn with a specified or auto-selected version of NodeJS. Also allows specifying a path to run yarn in.

- [how it works]('./../yarn-runner.md)


## Common Modules

- [Modules](./common/index.md)


## Node Tools

Scripts to report and fix problems with installed node versions

[Node Tools](./node-tools/index.md#node-tools)


[ :arrow_up: Back to top](#shell-tooling)
