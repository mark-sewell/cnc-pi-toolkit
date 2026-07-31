#!/usr/bin/env bash
#
# CNC Pi Toolkit
# Main installer entry point
#

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

load_library() {
    local name="$1"
    local file="${SCRIPT_DIR}/lib/${name}.sh"

    if [[ ! -f "${file}" ]]; then
        echo "Missing library: ${file}" >&2
        exit 1
    fi

    # shellcheck disable=SC1090
    source "${file}"
}

load_module() {
    local name="$1"
    local file="${SCRIPT_DIR}/modules/${name}.sh"

    if [[ ! -f "${file}" ]]; then
        echo "Missing module: ${file}" >&2
        exit 1
    fi

    # shellcheck disable=SC1090
    source "${file}"
}

load_library "colors"
load_library "logging"
load_library "system"
load_library "git"
load_library "node"
load_library "serial"
load_library "serial_io"

load_module "openbuilds"
load_module "grbl"
load_module "diagnostics"
load_module "branding"

installer_banner() {
    echo
    echo "================================="
    echo " CNC Pi Toolkit Installer"
    echo "================================="
    echo
}

installer_install_dependencies() {
    headline "Software Installation"

    git_install
    node_install
    openbuilds_install
}

installer_main() {
    installer_banner

    system_init
    print_system_summary

    echo
    installer_install_dependencies
    branding_install_terminal_banner
    branding_install_plymouth_theme

    echo
    diagnostics_run || true

    echo
    log_success "CNC Pi Toolkit installation completed."
}

installer_main "$@"
