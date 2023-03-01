#!/bin/env bash

echo "loading dev-tools/bash"
# Bash Config

export HISTTIMEFORMAT='%F %T |'
export HISTSIZE=4000
export HISTFILESIZE=$HISTSIZE
export HISTCONTROL=ignoredups:erasedups:ignorespace
export FORCE_COLOR=true

shopt -s histverify

# Git completion support
# shellcheck disable=SC1091
source "$DEVROOT/dev-tools/.git-completion-support"

# Command Prompt
# shellcheck disable=SC1091
source "$DEVROOT/dev-tools/src/prompt.sh"

# Functions
# shellcheck disable=SC1091
source "$DEVROOT/dev-tools/src/functions.sh"

# Alias
# shellcheck disable=SC1091
source "$DEVROOT/dev-tools/src/alias.sh"
