#!/usr/bin/env bash
#
# CNC Pi Toolkit
# Network Library
#
# Copyright (c) 2026 Mark Sewell
# SPDX-License-Identifier: MIT
#

set -Eeuo pipefail

#==============================================================================
# Configuration
#==============================================================================

readonly NETWORK_TIMEOUT=10
readonly NETWORK_RETRIES=3

#==============================================================================
# Private Functions
#==============================================================================

_http_client() {

    if command -v curl >/dev/null 2>&1; then
        echo "curl"
        return
    fi

    if command -v wget >/dev/null 2>&1; then
        echo "wget"
        return
    fi

    return 1

}

_http_head() {

    local url="$1"

    case "$(_http_client)" in

        curl)
            curl \
                --silent \
                --show-error \
                --fail \
                --location \
                --head \
                --connect-timeout "${NETWORK_TIMEOUT}" \
                "$url" >/dev/null
            ;;

        wget)
            wget \
                --spider \
                --timeout="${NETWORK_TIMEOUT}" \
                --quiet \
                "$url"
            ;;

        *)
            return 1
            ;;
    esac

}

#==============================================================================
# Public Functions
#==============================================================================

check_internet() {

    local url

    for url in \
        "https://github.com" \
        "https://deb.debian.org"; do

        if _http_head "$url"; then
            log_info "Reachable: ${url}"
            return 0
        fi

    done

    log_error "No internet connectivity detected."

    return 1

}

check_dns() {

    if getent hosts github.com >/dev/null 2>&1; then
        log_info "DNS resolution working."
        return 0
    fi

    log_error "DNS resolution failed."

    return 1

}

github_available() {

    _http_head "https://github.com"

}

download_file() {

    local url="$1"
    local destination="$2"

    log_info "Downloading $(basename "$destination")..."

    case "$(_http_client)" in

        curl)
            curl \
                --fail \
                --location \
                --retry "${NETWORK_RETRIES}" \
                --output "${destination}" \
                "${url}"
            ;;

        wget)
            wget \
                --tries="${NETWORK_RETRIES}" \
                -O "${destination}" \
                "${url}"
            ;;

        *)
            log_error "No download client found (curl or wget)."
            return 1
            ;;
    esac

    log_info "Download complete."

}

download_to_temp() {

    local url="$1"

    local file

    file="$(mktemp)"

    download_file "${url}" "${file}"

    printf '%s\n' "${file}"

}

wait_for_network() {

    local attempt

    for ((attempt=1; attempt<=NETWORK_RETRIES; attempt++)); do

        if check_internet; then
            return 0
        fi

        log_warning "Retry ${attempt}/${NETWORK_RETRIES}..."

        sleep 5

    done

    return 1

}

