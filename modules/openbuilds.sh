#!/usr/bin/env bash
#
# CNC Pi Toolkit
# OpenBuilds CONTROL management module
#

set -Eeuo pipefail

readonly OPENBUILDS_APP_NAME="OpenBuilds CONTROL"
readonly OPENBUILDS_PROJECT_DIR="${HOME}/OpenBuilds-CONTROL"

openbuilds_is_installed() {
    [[ -d "${OPENBUILDS_PROJECT_DIR}" ]] &&
        [[ -f "${OPENBUILDS_PROJECT_DIR}/package.json" ]]
}

openbuilds_get_version() {
    openbuilds_is_installed || return 1

    node -e \
        "console.log(require('${OPENBUILDS_PROJECT_DIR}/package.json').version)" \
        2>/dev/null
}

openbuilds_verify() {
    if ! openbuilds_is_installed; then
        log_warning "${OPENBUILDS_APP_NAME} is not installed."
        return 1
    fi

    if ! node_is_installed; then
        log_error "Node.js is required by ${OPENBUILDS_APP_NAME}."
        return 1
    fi

    if ! npm_is_installed; then
        log_error "npm is required by ${OPENBUILDS_APP_NAME}."
        return 1
    fi

    log_success \
        "${OPENBUILDS_APP_NAME} $(openbuilds_get_version) is installed."
}

openbuilds_install() {
    if openbuilds_verify >/dev/null 2>&1; then
        log_success "${OPENBUILDS_APP_NAME} is already installed."
        return 0
    fi

    log_error \
        "${OPENBUILDS_APP_NAME} installation is not implemented yet."
    return 1
}

openbuilds_remove() {
    if ! openbuilds_is_installed; then
        log_warning "${OPENBUILDS_APP_NAME} is not installed."
        return 0
    fi

    log_warning \
        "Automatic removal of ${OPENBUILDS_APP_NAME} is not implemented yet."
    return 1
}
