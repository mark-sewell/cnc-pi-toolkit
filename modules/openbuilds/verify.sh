#!/usr/bin/env bash
#
# CNC Pi Toolkit
# OpenBuilds Verification Module
#
# Verifies that the system is ready to install OpenBuilds CONTROL.
#

set -Eeuo pipefail

#------------------------------------------------------------------------------
# Verify Raspberry Pi
#------------------------------------------------------------------------------

verify_pi() {

    if [[ "${PI_MODEL:-}" == Raspberry\ Pi* ]]; then
        log_success "Detected: ${PI_MODEL}"
        return 0
    fi

    log_error "This installer only supports Raspberry Pi."

    return 1
}

#------------------------------------------------------------------------------
# Verify Operating System
#------------------------------------------------------------------------------

verify_os() {

    case "${OS_CODENAME:-}" in
        bookworm|trixie)
            log_success "Supported OS: ${OS_NAME} (${OS_CODENAME})"
            return 0
            ;;
    esac

    log_error "Unsupported operating system: ${OS_CODENAME:-unknown}"

    return 1
}

#------------------------------------------------------------------------------
# Verify Memory
#------------------------------------------------------------------------------

verify_memory() {

    if (( TOTAL_RAM_MB >= 3500 )); then
        log_success "RAM: ${TOTAL_RAM_MB} MB"
        return 0
    fi

    log_warning "Low RAM (${TOTAL_RAM_MB} MB). 4 GB or more recommended."

    return 0
}

#------------------------------------------------------------------------------
# Verify Disk Space
#------------------------------------------------------------------------------

verify_disk() {

    local available

    available=$(df -Pm "$HOME" | awk 'NR==2 {print $4}')

    if (( available >= 5000 )); then
        log_success "Disk space: ${available} MB free"
        return 0
    fi

    log_error "Only ${available} MB free. At least 5000 MB required."

    return 1
}

#------------------------------------------------------------------------------
# Verify Internet
#------------------------------------------------------------------------------

verify_network() {

    if check_internet; then
        log_success "Internet connection OK"
        return 0
    fi

    log_error "Internet connection unavailable."

    return 1
}

#------------------------------------------------------------------------------
# Verify Required Packages
#------------------------------------------------------------------------------

verify_packages() {

    local failed=0

    for package in git curl wget bash; do

        if is_package_installed "$package"; then
            log_success "$package installed"
        else
            log_error "$package missing"
            failed=1
        fi

    done

    return "$failed"
}

#------------------------------------------------------------------------------
# Verify Node.js
#------------------------------------------------------------------------------

verify_node() {

    if command -v node >/dev/null 2>&1; then
        log_success "Node.js $(node --version)"
    else
        log_error "Node.js not installed"
        return 1
    fi

    if command -v npm >/dev/null 2>&1; then
        log_success "npm $(npm --version)"
    else
        log_error "npm not installed"
        return 1
    fi

    return 0
}

#------------------------------------------------------------------------------
# Verify Serial Permissions
#------------------------------------------------------------------------------

verify_serial() {

    if id -nG "$USER" | grep -qw dialout; then
        log_success "User belongs to dialout group"
    else
        log_warning "User is not in dialout group"
    fi

    if list_serial_ports | grep -q .; then
        log_success "Serial device detected"
    else
        log_warning "No serial devices detected"
    fi

    return 0
}

#------------------------------------------------------------------------------
# Verify Existing Installation
#------------------------------------------------------------------------------

verify_existing_installation() {

    if [[ -d "$HOME/OpenBuilds-CONTROL" ]]; then
        log_warning "Existing OpenBuilds CONTROL installation found."
    else
        log_success "OpenBuilds CONTROL not installed."
    fi

    return 0
}

#------------------------------------------------------------------------------
# Verify Entire System
#------------------------------------------------------------------------------

verify_system() {

    local failures=0

    verify_pi || ((failures++))
    verify_os || ((failures++))
    verify_memory || ((failures++))
    verify_disk || ((failures++))
    verify_network || ((failures++))
    verify_packages || ((failures++))
    verify_node || ((failures++))
    verify_serial || ((failures++))
    verify_existing_installation || ((failures++))

    echo

    if (( failures == 0 )); then
        log_success "System verification passed."
        return 0
    fi

    log_error "System verification failed (${failures} error(s))."

    return 1
}

