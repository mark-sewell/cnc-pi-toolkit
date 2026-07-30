#!/usr/bin/env bash
#
# CNC Pi Toolkit
# Serial I/O library
#

set -Eeuo pipefail

readonly SERIAL_DEFAULT_BAUD="115200"
readonly SERIAL_DEFAULT_TIMEOUT="2"

serial_io_port_is_valid() {
    local port="$1"

    [[ -n "${port}" ]] || return 1
    [[ -e "${port}" ]] || return 1
    [[ -r "${port}" ]] || return 1
    [[ -w "${port}" ]] || return 1
}

serial_io_configure() {
    local port="$1"
    local baud="${2:-${SERIAL_DEFAULT_BAUD}}"

    serial_io_port_is_valid "${port}" || {
        log_error "Invalid or inaccessible serial port: ${port}"
        return 1
    }

    stty \
        -F "${port}" \
        "${baud}" \
        cs8 \
        -cstopb \
        -parenb \
        -ixon \
        -ixoff \
        raw \
        -echo
}

serial_io_write() {
    local port="$1"
    local data="$2"

    serial_io_port_is_valid "${port}" || {
        log_error "Cannot write to serial port: ${port}"
        return 1
    }

    printf '%s\r\n' "${data}" > "${port}"
}

serial_io_write_raw() {
    local port="$1"
    local data="$2"

    serial_io_port_is_valid "${port}" || {
        log_error "Cannot write raw data to serial port: ${port}"
        return 1
    }

    printf '%b' "${data}" > "${port}"
}

serial_io_read() {
    local port="$1"
    local timeout_seconds="${2:-${SERIAL_DEFAULT_TIMEOUT}}"

    serial_io_port_is_valid "${port}" || {
        log_error "Cannot read from serial port: ${port}"
        return 1
    }

    timeout "${timeout_seconds}" cat "${port}"
}

serial_io_flush() {
    local port="$1"

    serial_io_port_is_valid "${port}" || {
        log_error "Cannot flush serial port: ${port}"
        return 1
    }

    timeout 1 cat "${port}" >/dev/null 2>&1 || true
}

serial_io_verify() {
    local port="$1"

    if serial_io_port_is_valid "${port}"; then
        log_success "Serial port ${port} is accessible."
        return 0
    fi

    log_warning "Serial port ${port} is not accessible."
    return 1
}
