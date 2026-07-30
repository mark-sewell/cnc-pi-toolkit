#!/usr/bin/env bash
#
# CNC Pi Toolkit
# GRBL communication module
#

set -Eeuo pipefail

readonly GRBL_DEFAULT_BAUD="115200"
readonly GRBL_READ_TIMEOUT="2"

grbl_find_port() {
    serial_get_first_device
}

grbl_send_command() {
    local port="$1"
    local command="$2"

    serial_io_write "${port}" "${command}"
}

grbl_read_response() {
    local port="$1"
    local timeout_seconds="${2:-${GRBL_READ_TIMEOUT}}"

    serial_io_read "${port}" "${timeout_seconds}"
}

grbl_get_status() {
    local port="$1"

    grbl_send_command "${port}" "?"
    grbl_read_response "${port}"
}

grbl_get_info() {
    local port="$1"

    grbl_send_command "${port}" '$I'
    grbl_read_response "${port}"
}

grbl_soft_reset() {
    local port="$1"

    serial_io_write_raw "${port}" '\030'
}

grbl_verify() {
    local port
    local response

    port="$(grbl_find_port)" || true

    if [[ -z "${port}" ]]; then
        log_warning "No serial device available for GRBL detection."
        return 1
    fi

    serial_io_configure "${port}" "${GRBL_DEFAULT_BAUD}"
    serial_io_flush "${port}"

    log_info "Testing GRBL communication on ${port}..."

    response="$(grbl_get_info "${port}" 2>/dev/null || true)"

    if grep -q '^\[VER:' <<< "${response}"; then
        log_success "GRBL controller detected on ${port}."
        printf '%s\n' "${response}"
        return 0
    fi

    log_warning "No GRBL response detected on ${port}."
    return 1
}
