#!/usr/bin/env bash
#
# CNC Pi Toolkit
#
# Main installer entry point.
#

set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load libraries
source "${PROJECT_ROOT}/lib/common.sh"
source "${PROJECT_ROOT}/lib/colors.sh"
source "${PROJECT_ROOT}/lib/logging.sh"
source "${PROJECT_ROOT}/lib/system.sh"
source "${PROJECT_ROOT}/lib/network.sh"
source "${PROJECT_ROOT}/lib/packages.sh"

main() {

    print_banner

    init_logging

    system_init

    headline "System Summary"

    print_system_summary

    echo

    headline "Network"

    if wait_for_network; then
        success "Network connectivity verified."
    else
        error "Internet connectivity check failed."
        exit 1
    fi

    echo

    headline "Dependency Check"

    verify_dependencies \
        git \
        curl \
        wget \
        bash

    echo

    success "Framework initialisation completed."

    info "OpenBuilds installer module will be added in the next milestone."

}

main "$@"

