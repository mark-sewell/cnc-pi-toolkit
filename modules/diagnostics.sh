#!/usr/bin/env bash
#
# CNC Pi Toolkit
# Diagnostics module
#

set -Eeuo pipefail

diagnostics_check_system() {
    system_init
    print_system_summary
}

diagnostics_check_git() {
    if git_verify; then
        return 0
    fi

    return 1
}

diagnostics_check_node() {
    if node_verify; then
        return 0
    fi

    return 1
}

diagnostics_check_openbuilds() {
    if openbuilds_verify; then
        return 0
    fi

    return 1
}

diagnostics_check_serial() {
    if serial_verify; then
        return 0
    fi

    return 1
}

diagnostics_check_grbl() {
    if grbl_verify; then
        return 0
    fi

    return 1
}

diagnostics_run() {
    local failures=0

    echo
    echo "================================="
    echo " CNC Pi Toolkit Diagnostics"
    echo "================================="
    echo

    diagnostics_check_system || ((failures += 1))

    echo
    headline "Software"

    diagnostics_check_git || ((failures += 1))
    diagnostics_check_node || ((failures += 1))
    diagnostics_check_openbuilds || ((failures += 1))

    echo
    headline "Hardware"
    diagnostics_check_grbl || ((failures += 1))
    diagnostics_check_serial || ((failures += 1))

    echo

    if (( failures == 0 )); then
        log_success "Diagnostics completed successfully."
        return 0
    fi

    log_warning "Diagnostics completed with ${failures} issue(s)."
    return 1
}
