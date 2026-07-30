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
grbl_probe() {
    local port="${1:-$(grbl_find_port)}"
    local startup
    local info
    local status
    local firmware=""
    local vendor=""
    local state=""
    local mpos=""
    local wco=""
    local feed=""
    local spindle=""

    if [[ -z "${port}" ]]; then
        log_error "No serial device available for GRBL probing."
        return 1
    fi

    serial_io_configure "${port}" "${GRBL_DEFAULT_BAUD}"
    serial_io_flush "${port}"

    serial_io_write_raw "${port}" '\030'
    sleep 1
    startup="$(serial_io_read "${port}" 2 | tr -d '\r' || true)"

grbl_send_command "${port}" '$I'
sleep 0.3
info="$(grbl_read_response "${port}" 2 | tr -d '\r' || true)"

serial_io_write_raw "${port}" '?'
sleep 0.2
status="$(grbl_read_response "${port}" 2 | tr -d '\r' || true)"

    firmware="$(grep -oE 'Grbl [0-9]+\.[0-9]+[a-z]?' <<< "${startup}" | head -n 1 || true)"
    vendor="$(grep -vE '^(Grbl|\[|ok|$)' <<< "${info}" | head -n 1 || true)"
    if [[ "${info}" =~ \[VER:([^:]+): ]]; then
    version="${BASH_REMATCH[1]}"
fi

if [[ "${version}" =~ \.([0-9]{8})$ ]]; then
    build="${BASH_REMATCH[1]}"
fi

    state="$(sed -n 's/^<\([^|>]*\).*/\1/p' <<< "${status}" | head -n 1)"
    mpos="$(sed -n 's/.*|MPos:\([^|>]*\).*/\1/p' <<< "${status}" | head -n 1)"
    wco="$(sed -n 's/.*|WCO:\([^|>]*\).*/\1/p' <<< "${status}" | head -n 1)"
    feed="$(sed -n 's/.*|FS:\([^,|>]*\),.*/\1/p' <<< "${status}" | head -n 1)"
    spindle="$(sed -n 's/.*|FS:[^,|>]*,\([^|>]*\).*/\1/p' <<< "${status}" | head -n 1)"

    printf 'port=%s\n' "${port}"
    printf 'vendor=%s\n' "${vendor:-Unknown}"
    printf 'firmware=%s\n' "${firmware:-Unknown}"
    printf 'version=%s\n' "${version:-Unknown}"
    printf 'build=%s\n' "${build:-Unknown}"
    printf 'state=%s\n' "${state:-Unknown}"
    printf 'mpos=%s\n' "${mpos:-Unknown}"
    printf 'wco=%s\n' "${wco:-Unknown}"
    printf 'feed=%s\n' "${feed:-Unknown}"
    printf 'spindle=%s\n' "${spindle:-Unknown}"
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
