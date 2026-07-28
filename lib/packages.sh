#!/usr/bin/env bash
#
# CNC Pi Toolkit
# Package Management Library
#
# Copyright (c) 2026 Mark Sewell
# SPDX-License-Identifier: MIT
#

set -Eeuo pipefail

#==============================================================================
# Configuration
#==============================================================================

APT_UPDATED=0

#==============================================================================
# Private Functions
#==============================================================================

_run_apt() {
    sudo DEBIAN_FRONTEND=noninteractive apt-get "$@"
}

#==============================================================================
# Public Functions
#==============================================================================

package_manager_available() {
    command -v apt-get >/dev/null 2>&1
}

update_package_index() {

    if (( APT_UPDATED == 1 )); then
        return 0
    fi

    log_info "Updating package index..."

    _run_apt update

    APT_UPDATED=1

    log_info "Package index updated."

}

is_package_installed() {

    local package="$1"

    dpkg -s "${package}" >/dev/null 2>&1

}

install_package() {

    local package="$1"

    if is_package_installed "${package}"; then
        log_info "Package '${package}' already installed."
        return 0
    fi

    update_package_index

    log_info "Installing ${package}..."

    _run_apt install -y "${package}"

    log_info "Installed ${package}."

}

install_packages() {

    local package

    update_package_index

    for package in "$@"; do
        install_package "${package}"
    done

}

remove_package() {

    local package="$1"

    if ! is_package_installed "${package}"; then
        log_info "Package '${package}' is not installed."
        return 0
    fi

    log_warning "Removing ${package}..."

    _run_apt remove -y "${package}"

    log_info "Removed ${package}."

}

autoremove_packages() {

    log_info "Running autoremove..."

    _run_apt autoremove -y

}

clean_package_cache() {

    log_info "Cleaning package cache..."

    _run_apt autoclean
    _run_apt clean

}

upgrade_system() {

    update_package_index

    log_info "Upgrading installed packages..."

    _run_apt upgrade -y

}

full_upgrade_system() {

    update_package_index

    log_info "Running full system upgrade..."

    _run_apt full-upgrade -y

}

verify_dependencies() {

    local missing=0
    local package

    for package in "$@"; do

        if ! is_package_installed "${package}"; then
            log_warning "Missing dependency: ${package}"
            missing=1
        fi

    done

    return "${missing}"

}

