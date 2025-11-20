#!/bin/env bash
# shellcheck disable=SC2034

echo "  loading prompt.sh"
# Colors - Regular
Black="\[\033[0;30m\]"        # Black
Red="\[\033[0;31m\]"          # Red
Green="\[\033[0;32m\]"        # Green
Yellow="\[\033[0;33m\]"       # Yellow
Blue="\[\033[0;34m\]"         # Blue
Purple="\[\033[0;35m\]"       # Purple
Cyan="\[\033[0;36m\]"         # Cyan
White="\[\033[0;37m\]"        # White

# Colors - Bold High Intensity
BIBlack="\[\033[1;90m\]"      # Black
BIRed="\[\033[1;91m\]"        # Red
BIGreen="\[\033[1;92m\]"      # Green
BIYellow="\[\033[1;93m\]"     # Yellow
BIBlue="\[\033[1;94m\]"       # Blue
BIPurple="\[\033[1;95m\]"     # Purple
BICyan="\[\033[1;96m\]"       # Cyan
BIWhite="\[\033[1;97m\]"      # White

# Colors - Reset
Color_Off="\[\033[0m\]"       # Reset

# Misc
Time12h="\T"
PathShort="\w"
Date="\d"

# obtain the folder name of the selected node version (from nvm symlink)
get_symlink_basename() {
    # Check if NVM_SYMLINK is set
    if [ -z "$NVM_SYMLINK" ]; then
        echo "NVM_SYMLINK is not set."
        return 1
    fi

    # Get the actual target path of the symlink
    local target
    target=$(readlink "$NVM_SYMLINK")

    # Extract the basename of the folder
    local version="${target##*/}"  # Get the last part after the last '/'

    # Echo the extracted version
    echo "$version"
}

# Helper: get parent directory name (portable)
get_parent_dirname() {
    local dir
    dir="${NVM_BIN%/*}"
    echo "${dir##*/}"
}

# test if NVM_SYMLINK exists
if [[ -L "$NVM_SYMLINK" ]]; then
    # prompt for use in windows
    echo "   -- windows prompt"
    export PS1=$Cyan$Time12h$Color_Off$Purple' <$(get_symlink_basename)>'$Color_Off'$(git branch &>/dev/null;\
    if [ $? -eq 0 ]; then \
    echo "$(echo `git status` | grep "nothing to commit" > /dev/null 2>&1; \
    if [ "$?" -eq "0" ]; then \
        # Clean repository - nothing to commit
        echo "'$Green'"$(__git_ps1 " {%s}"); \
    else \
        # Changes to working tree
        echo "'$Red'"$(__git_ps1 " {%s}"); \
    fi) '$Yellow$PathShort$Color_Off'\n$$ \$ "; \
    else \
    # Prompt when not in GIT repo
    echo " '$Yellow$PathShort$Color_Off'\n$$ \$ "; \
    fi)'
fi


if [ -d "$NVM_DIR" ]; then
    echo "   -- linux prompt"
    # prompt for use in linux
    export PS1=$Cyan$Time12h$Color_Off$Purple' <$(get_parent_dirname)>'$Color_Off'$(git branch &>/dev/null;\
    if [ $? -eq 0 ]; then \
    echo "$(echo `git status` | grep "nothing to commit" > /dev/null 2>&1; \
    if [ "$?" -eq "0" ]; then \
        # Clean repository - nothing to commit
        echo "'$Green'"$(__git_ps1 " {%s}"); \
    else \
        # Changes to working tree
        echo "'$Red'"$(__git_ps1 " {%s}"); \
    fi) '$Yellow$PathShort$Color_Off'\n$$ \$ "; \
    else \
    # Prompt when not in GIT repo
    echo " '$Yellow$PathShort$Color_Off'\n$$ \$ "; \
    fi)'

fi
