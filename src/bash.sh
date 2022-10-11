echo "loading dev-tools/bash"
# Bash Config

export HISTTIMEFORMAT='%F %T |'
export HISTSIZE=4000
export HISTFILESIZE=$HISTSIZE
export HISTCONTROL=ignoredups:erasedups:ignorespace
export FORCE_COLOR=true

shopt -s histverify

# Git completion support
source "$DEVROOT/dev-tools/.git-completion-support"

# Command Prompt
source "$DEVROOT/dev-tools/src/prompt.sh"

# Functions
source "$DEVROOT/dev-tools/src/functions.sh"

# Alias
source "$DEVROOT/dev-tools/src/alias.sh"

# Add yarn exec to path
path_add "$HOME/.yarn/bin"

# Add global binaries to path
