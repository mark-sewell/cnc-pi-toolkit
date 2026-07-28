#!/usr/bin/env bash
#
# CNC Pi Toolkit
# Logging library
#

set -Eeuo pipefail

log_info() {
    printf "[INFO] %s\n" "$*"
}

log_success() {
    printf "[ OK ] %s\n" "$*"
}

log_warning() {
    printf "[WARN] %s\n" "$*"
}

log_error() {
    printf "[FAIL] %s\n" "$*" >&2
}
