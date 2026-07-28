#!/usr/bin/env bash
#
# CNC Pi Toolkit
# System information library
#

set -Eeuo pipefail


system_get_architecture() {
    uname -m
}


system_get_kernel() {
    uname -r
}


system_get_hostname() {
    hostname
}


system_get_os_name() {

    if [[ -f /etc/os-release ]]; then
        # shellcheck disable=SC1091
        source /etc/os-release
        printf '%s\n' "${PRETTY_NAME}"

    else
        printf '%s\n' "Unknown Linux"

    fi
}


system_get_os_codename() {

    if [[ -f /etc/os-release ]]; then
        # shellcheck disable=SC1091
        source /etc/os-release
        printf '%s\n' "${VERSION_CODENAME:-unknown}"

    else
        printf '%s\n' "unknown"

    fi
}


system_get_ram_mb() {

    awk '/MemTotal/ {printf "%.0f\n", $2/1024}' /proc/meminfo

}


system_get_cpu_cores() {

    nproc

}


system_get_disk_free_mb() {

    df -m / | awk 'NR==2 {print $4}'

}


system_is_raspberry_pi() {

    if [[ -f /proc/device-tree/model ]]; then
        grep -qi "raspberry" /proc/device-tree/model
    else
        return 1
    fi

}


system_get_model() {

    if [[ -f /proc/device-tree/model ]]; then
        tr -d '\0' < /proc/device-tree/model

    else
        printf '%s\n' "Unknown"

    fi

}

