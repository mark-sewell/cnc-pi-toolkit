#!/usr/bin/env bash
#
# CNC Pi Toolkit
<<<<<<< HEAD
# Logging library
#

set -Eeuo pipefail


log_info() {
    printf "[INFO] %s\n" "$*"
}


log_success() {
    printf "[ OK ] %s\n" "$*"
}


log_warning() {
    printf "[WARN] %s\n" "$*"
}


log_error() {
    printf "[FAIL] %s\n" "$*" >&2
=======
# Logging Library
#
# Copyright (c) 2026 Mark Sewell
# Licensed under the MIT License.

#------------------------------------------------------------------------------
# Logging configuration
#------------------------------------------------------------------------------

readonly LOG_DIR="${HOME}/.local/share/cnc-pi-toolkit/logs"
readonly LOG_FILE="${LOG_DIR}/toolkit.log"

LOG_LEVEL_INFO=1
LOG_LEVEL_WARNING=2
LOG_LEVEL_ERROR=3
LOG_LEVEL_DEBUG=4

LOG_LEVEL=${LOG_LEVEL_INFO}

#------------------------------------------------------------------------------
# Initialise logging
#------------------------------------------------------------------------------

init_logging() {

    mkdir -p "${LOG_DIR}"

    touch "${LOG_FILE}" || {
        echo "Unable to create log file: ${LOG_FILE}" >&2
        exit 1
    }

}

#------------------------------------------------------------------------------
# Internal helper
#------------------------------------------------------------------------------

_timestamp() {

    date "+%Y-%m-%d %H:%M:%S"

}

_log() {

    local level="$1"
    shift

    local message="$*"
    local timestamp

    timestamp="$(_timestamp)"

    printf "[%s] [%s] %s\n" \
        "${timestamp}" \
        "${level}" \
        "${message}" \
        >> "${LOG_FILE}"

}

#------------------------------------------------------------------------------
# Public logging functions
#------------------------------------------------------------------------------

log_info() {

    [[ ${LOG_LEVEL} -ge ${LOG_LEVEL_INFO} ]] || return

    info "$*"

    _log INFO "$*"

}

log_warning() {

    [[ ${LOG_LEVEL} -ge ${LOG_LEVEL_WARNING} ]] || return

    warning "$*"

    _log WARNING "$*"

}

log_error() {

    [[ ${LOG_LEVEL} -ge ${LOG_LEVEL_ERROR} ]] || return

    error "$*"

    _log ERROR "$*"

}

log_debug() {

    [[ ${LOG_LEVEL} -ge ${LOG_LEVEL_DEBUG} ]] || return

    printf "[DEBUG] %s\n" "$*"

    _log DEBUG "$*"

}

#------------------------------------------------------------------------------
# Log system information
#------------------------------------------------------------------------------

log_system_information() {

    log_info "Toolkit Version : ${TOOLKIT_VERSION}"

    log_info "Hostname        : $(hostname)"

    log_info "Kernel          : $(uname -r)"

    log_info "Architecture    : $(uname -m)"

    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        log_info "Operating System: ${PRETTY_NAME}"
    fi

}

#------------------------------------------------------------------------------
# Rotate log file
#------------------------------------------------------------------------------

rotate_log() {

    if [[ -f "${LOG_FILE}" ]]; then

        local size

        size=$(stat -c%s "${LOG_FILE}")

        if (( size > 1048576 )); then

            mv "${LOG_FILE}" "${LOG_FILE}.old"

            touch "${LOG_FILE}"

        fi

    fi


}

