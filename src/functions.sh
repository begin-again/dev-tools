echo "  loading functions.sh"

# Adds to path only if not already present
path_add() {

    # check if not already present
    if [ -d "$1" ]; then
        $(tr ":" "\n" <<< $PATH | grep -qv "$1")
        code="$?"
        if [ "$code" = "0" ]; then
            if [ -n "$2" ]; then echo "added to path"; fi
            export PATH="$1:$PATH"
        else
            if [ -n "$2" ]; then echo "duplicate"; fi
        fi
    else
        if [ -n "$2" ]; then echo "failed - unable to find folder $1"; fi
    fi

}

# Shows the files changed since the common ancestor
changed() {

    if [ -z "$1" ]; then
        branch="master"
    else
        branch="$1"
    fi
    git diff --name-only HEAD $(git merge-base HEAD "$branch")

}

# Checks to see if a merge will produce conflicts
checkmerge() {

    if [ -z "$1" ]; then
        branch="master"
    else
        branch="$1"
    fi
    git merge --no-commit --no-ff "$branch"
    # git merge --abort

}

# Display reflogs for current or specified local repository
gref() {

    if [ -n "$1" ]; then
        if [ -d "$DEVROOT/$1" ]; then
            git -C "$DEVROOT/$1" log --walk-reflogs --format="%gd %C(yellow)%h %Cgreen%cd%Cred%d %C(yellow)%gs %Creset%s" --date=format:"%d %b %H:%M"
        else
            echo "Cannot find $DEVROOT/$1"
        fi
    else
        git log --walk-reflogs --format="%gd %C(yellow)%h %Cgreen%cd%Cred%d %C(yellow)%gs %Creset%s" --date=format:"%d %b %H:%M"
    fi

}

# pretty one line git log of current repository
gitlog() {
    entries=$1
    branch="$2"
    if [ -n "$entries" ]; then
        entries="-${entries#-}"
        if [ -n "$branch" ]; then
            git log  "$branch" --format="%h %cd | %an | %(describe:tags) | %s" --date=format:"%m-%d-%y %H:%M" $entries | column -ts '|' -T 4
        else
            git log  --format="%h %cd | %an | %(describe:tags) | %s" --date=format:"%m-%d-%y %H:%M" $entries | column -ts '|' -T 4
        fi
    else
        if [ -n "$branch" ]; then
            git log  "$branch" --format="%h %cd | %an | %(describe:tags) | %s" --date=format:"%m-%d-%y %H:%M" | column -ts '|' -T 4
        else
            git log  --format="%h %cd | %an | %(describe:tags) | %s" --date=format:"%m-%d-%y %H:%M" | column -ts '|' -T 4
        fi
    fi
}
