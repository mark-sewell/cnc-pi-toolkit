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
source "${PROJECT_ROOT}/lib/node.sh"

# Load modules
source "${PROJECT_ROOT}/modules/openbuilds/verify.sh"
source "${PROJECT_ROOT}/modules/openbuilds/install.sh"
main() {

    print_banner

    log_info "Starting CNC Pi Toolkit..."

    log_info "Checking system..."
    system_init
    print_system_summary

    log_info "Checking network..."

    check_internet
    check_dns
    github_available

    log_info "Checking Node.js..."
    node_verify

    log_info "Verifying OpenBuilds CONTROL..."
    verify_system

    openbuilds_install

    log_success "System verification completed."

}

main "$@"
