#!/usr/bin/env bash
#
# CNC Pi Toolkit
<<<<<<< HEAD
# System information library
=======
# System Detection Library
#
# Copyright (c) 2026 Mark Sewell
# SPDX-License-Identifier: MIT
>>>>>>> feature/project-foundation
#

set -Eeuo pipefail

<<<<<<< HEAD

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
=======
#==============================================================================
# Read-only system information
#==============================================================================

readonly HOSTNAME="$(hostname)"
readonly KERNEL="$(uname -r)"
readonly ARCH="$(uname -m)"

OS_NAME=""
OS_VERSION=""
OS_CODENAME=""

PI_MODEL="Unknown"
PI_REVISION="Unknown"

TOTAL_RAM_MB=0

#==============================================================================
# Operating System
#==============================================================================

detect_os() {
>>>>>>> feature/project-foundation

    if [[ -f /etc/os-release ]]; then
        # shellcheck disable=SC1091
        source /etc/os-release
<<<<<<< HEAD
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
=======

        OS_NAME="${NAME:-Unknown}"
        OS_VERSION="${VERSION:-Unknown}"
        OS_CODENAME="${VERSION_CODENAME:-Unknown}"
    fi

}

#==============================================================================
# Raspberry Pi Model
#==============================================================================

detect_pi_model() {

    if [[ -f /proc/device-tree/model ]]; then
        PI_MODEL="$(tr -d '\0' </proc/device-tree/model)"
>>>>>>> feature/project-foundation
    fi

}

<<<<<<< HEAD

system_get_model() {

    if [[ -f /proc/device-tree/model ]]; then
        tr -d '\0' < /proc/device-tree/model

    else
        printf '%s\n' "Unknown"
=======
#==============================================================================
# Memory
#==============================================================================

detect_memory() {

    TOTAL_RAM_MB=$(awk '/MemTotal/ {printf "%.0f", $2/1024}' /proc/meminfo)

}

#==============================================================================
# CPU Temperature
#==============================================================================

cpu_temperature() {

    if [[ -f /sys/class/thermal/thermal_zone0/temp ]]; then

        awk '{ printf "%.1f\n", $1 / 1000 }' \
            /sys/class/thermal/thermal_zone0/temp

    else

        echo "Unknown"
>>>>>>> feature/project-foundation

    fi

}

<<<<<<< HEAD
=======
#==============================================================================
# OpenGL Detection
#==============================================================================

has_opengl() {

    command -v glxinfo >/dev/null 2>&1 || return 1

    glxinfo >/dev/null 2>&1

}

#==============================================================================
# Vulkan Detection
#==============================================================================

has_vulkan() {

    command -v vulkaninfo >/dev/null 2>&1 || return 1

    vulkaninfo >/dev/null 2>&1

}

#==============================================================================
# Serial Devices
#==============================================================================

list_serial_ports() {

    find /dev \
        -maxdepth 1 \
        \( -name "ttyUSB*" -o -name "ttyACM*" \) \
        | sort

}

#==============================================================================
# Summary
#==============================================================================

print_system_summary() {

    echo
    echo "==============================="
    echo "System Information"
    echo "==============================="

    echo "Hostname      : ${HOSTNAME}"
    echo "Model         : ${PI_MODEL}"
    echo "Architecture  : ${ARCH}"
    echo "Kernel        : ${KERNEL}"

    echo "Operating Sys : ${OS_NAME}"
    echo "Version       : ${OS_VERSION}"
    echo "Codename      : ${OS_CODENAME}"

    echo "RAM           : ${TOTAL_RAM_MB} MB"

    echo "CPU Temp      : $(cpu_temperature) °C"

    if has_opengl; then
        echo "OpenGL        : Available"
    else
        echo "OpenGL        : Not detected"
    fi

    if has_vulkan; then
        echo "Vulkan        : Available"
    else
        echo "Vulkan        : Not detected"
    fi

    echo
    echo "Serial Ports"

    if list_serial_ports | grep -q .; then
        list_serial_ports
    else
        echo "None detected"
    fi

}

#==============================================================================
# Initialise
#==============================================================================

system_init() {

    detect_os
    detect_pi_model
    detect_memory

}


