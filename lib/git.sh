#!/usr/bin/env bash
#
# CNC Pi Toolkit
# Git management library
#

set -Eeuo pipefail

git_is_installed() {
    command -v git >/dev/null 2>&1
}

git_get_version() {
    git_is_installed || return 1
    git --version | awk '{print $3}'
}

git_verify() {
    if ! git_is_installed; then
        log_warning "Git is not installed."
        return 1
    fi

    log_success "Git $(git_get_version) is installed."
}

git_install() {
    if git_is_installed; then
        log_success "Git $(git_get_version) is already installed."
        return 0
    fi

    log_info "Installing Git..."

    sudo apt-get update
    sudo apt-get install -y git

    if git_is_installed; then
        log_success "Git $(git_get_version) installed successfully."
    else
        log_error "Git installation failed."
        return 1
    fi
}
