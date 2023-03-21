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

# test if NVM_BIN populated
if [ -z "$NVM_BIN" ]; then
  # NVM_BIN not populated
    export PS1=$Cyan$Time12h$Color_Off$Purple' <$(basename $(dirname "$NVM_BIN"))>'$Color_Off'$(git branch &>/dev/null;\
    if [ $? -eq 0 ]; then \
    echo "$(echo `git status` | grep "nothing to commit" > /dev/null 2>&1; \
    if [ "$?" -eq "0" ]; then \
        # Clean repository - nothing to commit
        echo "'$Green'"$(__git_ps1 " (%s)"); \
    else \
        # Changes to working tree
        echo "'$Red'"$(__git_ps1 " {%s}"); \
    fi) '$Yellow$PathShort$Color_Off'\n$$ \$ "; \
    else \
    # Prompt when not in GIT repo
    echo " '$Yellow$PathShort$Color_Off'\n$$ \$ "; \
    fi)'
else
    export PS1=$Cyan$Time12h$Color_Off$Purple' <$(basename $(readlink "$NVM_SYMLINK"))>'$Color_Off'$(git branch &>/dev/null;\
    if [ $? -eq 0 ]; then \
    echo "$(echo `git status` | grep "nothing to commit" > /dev/null 2>&1; \
    if [ "$?" -eq "0" ]; then \
        # Clean repository - nothing to commit
        echo "'$Green'"$(__git_ps1 " (%s)"); \
    else \
        # Changes to working tree
        echo "'$Red'"$(__git_ps1 " {%s}"); \
    fi) '$Yellow$PathShort$Color_Off'\n$$ \$ "; \
    else \
    # Prompt when not in GIT repo
    echo " '$Yellow$PathShort$Color_Off'\n$$ \$ "; \
    fi)'
fi
