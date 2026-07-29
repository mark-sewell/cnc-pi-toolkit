#!/usr/bin/env bash
#
# CNC Pi Toolkit
# Main installer entry point
#
set -Eeuo pipefail


SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"


# -------------------------------------------------
# Load libraries
# -------------------------------------------------

load_library() {
    local library="$1"

    if [[ -f "${SCRIPT_DIR}/lib/${library}.sh" ]]; then
        # shellcheck disable=SC1090
        source "${SCRIPT_DIR}/lib/${library}.sh"
    else
        echo "Missing library: ${library}.sh"
        exit 1
    fi
}


load_library "logging"
load_library "system"
load_library "node"


# -------------------------------------------------
# Basic installer functions
# -------------------------------------------------

installer_banner() {

    echo
    echo "================================="
    echo " CNC Pi Toolkit Installer"
    echo "================================="
    echo

}


installer_check() {

    log_info "Checking system..."
    system_init
    print_system_summary

    if ! node_is_installed; then
        log_warning "Node.js not installed."
    else
        log_success "Node.js $(node_get_version)"
    fi

}


installer_main() {

    installer_banner

    installer_check

    echo
   log_success "Installer framework ready."
    echo

}


installer_main
