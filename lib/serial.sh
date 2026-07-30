#!/usr/bin/env bash
#
# CNC Pi Toolkit
# Serial device detection library
#

set -Eeuo pipefail

serial_list_devices() {
    local device

    for device in \
        /dev/ttyUSB* \
        /dev/ttyACM* \
        /dev/ttyAMA* \
        /dev/serial0 \
        /dev/serial1
    do
        [[ -e "${device}" ]] || continue
        printf '%s\n' "${device}"
    done
}

serial_has_devices() {
    [[ -n "$(serial_list_devices)" ]]
}

serial_count_devices() {
    serial_list_devices | wc -l
}

serial_verify() {
    local count

    count="$(serial_count_devices)"

    if (( count == 0 )); then
        log_warning "No serial devices detected."
        return 1
    fi

    log_success "${count} serial device(s) detected."

    serial_list_devices
}

serial_get_first_device() {
    serial_list_devices | head -n 1
}

serial_device_is_accessible() {
    local device="$1"

    [[ -e "${device}" ]] || return 1
    [[ -r "${device}" ]] || return 1
    [[ -w "${device}" ]] || return 1
}
