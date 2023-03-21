#!/bin/env bash

echo "  loading alias.sh"
# fixes the stdout is not tty error
[[ $(type -t node) == "alias" ]] && unalias node

# Misc
alias find='/usr/bin/find'
alias ll='ls -ltrh'

## tools
alias resource='source $HOME/.bashrc'
alias clean='node $DEVROOT/dev-tools/src/clean/index.js'
alias grefp='node $DEVROOT/dev-tools/src/grefplus'
alias branches='node $DEVROOT/dev-tools/src/branches'
alias nt='node $DEVROOT/dev-tools/src/node-tools'
alias yn='node $DEVROOT/dev-tools/src/yarn'
alias sp='node $DEVROOT/dev-tools/src/spawner'
alias scripts='node $DEVROOT/dev-tools/src/misc/scripts'
alias engines='node $DEVROOT/dev-tools/src/misc/engines -p "."'

# git
alias check-merge='checkmerge'
__git_complete gb _git_branch
alias gb='git --no-pager branch -v --sort=committerdate'
alias gclean='git reset -q --hard && git clean -fd;git status'
alias gcm='git commit'
__git_complete gco _git_checkout
alias gco='git checkout'
alias gl='gitlog'

alias gsl='git stash list --date=local'
alias gst='git status'
alias gtemp='gcm --no-verify -am "temp"'
alias pull='git pull'
alias stash-all='git stash save --include-untracked'
