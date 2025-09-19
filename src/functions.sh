#!/bin/env bash

echo "  loading functions.sh"

# Adds to path only if not already present
path_add() {

    # check if not already present
    if [ -d "$1" ]; then
        tr ":" "\n" <<< "$PATH" | grep -qv "$1"
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
    differ=$(git merge-base HEAD "$branch")
    git diff --name-only HEAD "$differ"


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

    # normalize entry count like: gitlog 25  or gitlog -25
    [ -n "$entries" ] && entries="-${entries#-}"

    fmt='%h | %p | %cd | %an | %(describe:tags) | %s'
    datearg="--date=format:%m-%d-%y %H:%M"

    if [ -n "$branch" ]; then
        git log "$branch" --format="$fmt" "$datearg" $entries
    else
        git log --format="$fmt" "$datearg" $entries
    fi | awk -F'|' '
        {
          # trim whitespace
          for (i=1;i<=NF;i++) gsub(/^[ \t]+|[ \t]+$/, "", $i)

          commit=$1
          parents=$2   # all parent hashes (blank if none)

          printf "%s | %s | %s | %s | %s | %s\n", \
                 commit, parents, $3, $4, $5, $6
        }
    ' | column -ts '|'
}


gitlogp() {
    entries=$1
    branch="$2"
    [ -n "$entries" ] && entries="-${entries#-}"

    fmt='%h|%p|%cd|%an|%(describe:tags)|%s'
    datearg="--date=format:%m-%d-%y %H:%M"

    if [ -n "$branch" ]; then
        git log "$branch" --format="$fmt" "$datearg" $entries
    else
        git log --format="$fmt" "$datearg" $entries
    fi | awk -F'|' '
        {
          commit=$1
          parents=$2
          date=$3
          author=$4
          tag=$5
          subject=$6

          order[NR]=commit
          parentsOf[commit]=parents
          dateOf[commit]=date
          authorOf[commit]=author
          tagOf[commit]=tag
          subjectOf[commit]=subject

          n=split(parents, arr, " ")
          parentCount[commit]=n

          for (i=1; i<=n; i++) {
            if (arr[i] != "") parentOf[commit]=parentOf[commit] " " arr[i]
          }

          # mark the *second parent* of merges
          if (n > 1) {
            markBranch[arr[2]]=1
          }
        }
        END {
          # propagate [side] marks backwards
          changed=1
          while (changed) {
            changed=0
            for (c in parentOf) {
              split(parentOf[c], arr, " ")
              for (i=1;i<=length(arr);i++) {
                p=arr[i]
                if (p in markBranch && !(c in markBranch)) {
                  markBranch[c]=1
                  changed=1
                }
              }
            }
          }

          for (i=1; i<=NR; i++) {
            c=order[i]

            # decide marker
            if (parentCount[c] > 1) {
              flag="[merge]"
            } else if (c in markBranch) {
              flag="[side]"
            } else {
              flag="      "
            }

            printf "%-8s %-7s  %-20s  %-14s  %-15s  %-25s  %s\n", \
                   c, flag, parentsOf[c], dateOf[c], authorOf[c], tagOf[c], subjectOf[c]
          }
        }
    '
}
