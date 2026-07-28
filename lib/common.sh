#!/usr/bin/env bash
#
# CNC Pi Toolkit
# Common utility functions
#
# Copyright (c) 2026 Mark Sewell
# Licensed under the MIT License.

set -Eeuo pipefail

#------------------------------------------------------------------------------
# Project information
#------------------------------------------------------------------------------

readonly TOOLKIT_NAME="CNC Pi Toolkit"
readonly TOOLKIT_VERSION="0.1.0-alpha1"

#------------------------------------------------------------------------------
# Helper functions
#------------------------------------------------------------------------------

print_banner() {
    echo
    echo "==============================================="
    echo "           ${TOOLKIT_NAME}"
    echo "             Version ${TOOLKIT_VERSION}"
    echo "==============================================="
    echo
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

require_command() {
    if ! command_exists "$1"; then
        echo "Error: Required command '$1' is not installed."
        exit 1
    fi
}

create_directory() {
    mkdir -p "$1"
}

project_root() {
    git rev-parse --show-toplevel 2>/dev/null || pwd
}

