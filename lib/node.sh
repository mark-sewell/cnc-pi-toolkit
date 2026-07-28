#!/usr/bin/env bash
#
# CNC Pi Toolkit
# Node.js management library
#

set -Eeuo pipefail


node_is_installed() {
    command -v node >/dev/null 2>&1
}


npm_is_installed() {
    command -v npm >/dev/null 2>&1
}


node_get_version() {

    if node_is_installed; then
        node --version
    else
        return 1
    fi

}


npm_get_version() {

    if npm_is_installed; then
        npm --version
    else
        return 1
    fi

}


node_get_major_version() {

    local version

    version="$(node_get_version)" || return 1

    version="${version#v}"

    printf '%s\n' "${version%%.*}"

}


node_verify() {

    if ! node_is_installed; then
        echo "Node.js not installed"
        return 1
    fi


    if ! npm_is_installed; then
        echo "npm not installed"
        return 1
    fi


    echo "Node.js: $(node_get_version)"
    echo "npm: $(npm_get_version)"

    return 0

}

