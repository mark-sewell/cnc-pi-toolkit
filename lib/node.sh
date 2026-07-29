#!/usr/bin/env bash
#
# CNC Pi Toolkit
# Node.js management library
#

set -Eeuo pipefail

readonly NODE_VERSION="20.20.2"

node_is_installed() {
    command -v node >/dev/null 2>&1
}

npm_is_installed() {
    command -v npm >/dev/null 2>&1
}

node_get_version() {
    node_is_installed || return 1
    node --version
}

npm_get_version() {
    npm_is_installed || return 1
    npm --version
}

node_get_major_version() {
    local version

    version="$(node_get_version)" || return 1
    version="${version#v}"

    printf '%s\n' "${version%%.*}"
}

node_verify() {
    if ! node_is_installed; then
        echo "Node.js not installed"
        return 1
    fi

    if ! npm_is_installed; then
        echo "npm not installed"
        return 1
    fi

    echo "Node.js: $(node_get_version)"
    echo "npm: $(npm_get_version)"
}

node_install() {
    local version="${NODE_VERSION}"
    local architecture
    local archive
    local url
    local temp_dir

    if node_verify >/dev/null 2>&1; then
        log_success "Node.js $(node_get_version) is already installed."
        return 0
    fi

    architecture="$(dpkg --print-architecture)"

    case "${architecture}" in
        armhf)
            archive="node-v${version}-linux-armv7l.tar.xz"
            ;;
        arm64)
            archive="node-v${version}-linux-arm64.tar.xz"
            ;;
        *)
            log_error "Unsupported architecture: ${architecture}"
            return 1
            ;;
    esac

    url="https://nodejs.org/dist/v${version}/${archive}"
    temp_dir="$(mktemp -d)"

    log_info "Installing Node.js v${version} for ${architecture}..."

    sudo apt-get update
    sudo apt-get install -y curl xz-utils ca-certificates

    curl -fsSL "${url}" -o "${temp_dir}/${archive}"
    curl -fsSL "https://nodejs.org/dist/v${version}/SHASUMS256.txt" \
        -o "${temp_dir}/SHASUMS256.txt"

    (
        cd "${temp_dir}"
        grep " ${archive}$" SHASUMS256.txt | sha256sum --check -
    ) || {
        log_error "Node.js checksum verification failed."
        rm -rf "${temp_dir}"
        return 1
    }

    sudo tar -xJf "${temp_dir}/${archive}" \
        --strip-components=1 \
        -C /usr/local

    rm -rf "${temp_dir}"

    if node_verify; then
        log_success "Node.js installation completed."
    else
        log_error "Node.js installation verification failed."
        return 1
    fi
}
