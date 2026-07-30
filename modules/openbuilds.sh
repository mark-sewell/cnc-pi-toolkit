#!/usr/bin/env bash
#
# CNC Pi Toolkit
# OpenBuilds CONTROL management module
#

set -Eeuo pipefail

readonly OPENBUILDS_APP_NAME="OpenBuilds CONTROL"
readonly OPENBUILDS_REPOSITORY="https://github.com/OpenBuilds/OpenBuilds-CONTROL.git"
readonly OPENBUILDS_PROJECT_DIR="${HOME}/OpenBuilds-CONTROL"
readonly OPENBUILDS_DESKTOP_FILE="OpenBuilds-CONTROL.desktop"


openbuilds_serialport_binding_path() {
    printf '%s\n' \
        "${OPENBUILDS_PROJECT_DIR}/node_modules/@serialport/bindings-cpp/build/Release/bindings.node"
}


openbuilds_is_installed() {
    [[ -d "${OPENBUILDS_PROJECT_DIR}/.git" ]] &&
        [[ -f "${OPENBUILDS_PROJECT_DIR}/package.json" ]] &&
        [[ -x "${OPENBUILDS_PROJECT_DIR}/node_modules/.bin/electron" ]]
}


openbuilds_get_version() {
    [[ -f "${OPENBUILDS_PROJECT_DIR}/package.json" ]] || return 1

    node -p \
        "require('${OPENBUILDS_PROJECT_DIR}/package.json').version" \
        2>/dev/null
}

openbuilds_get_architecture() {
    dpkg --print-architecture
}

openbuilds_is_armhf() {
    [[ "$(openbuilds_get_architecture)" == "armhf" ]]
}

openbuilds_is_arm64() {
    [[ "$(openbuilds_get_architecture)" == "arm64" ]]
}

openbuilds_is_amd64() {
    [[ "$(openbuilds_get_architecture)" == "amd64" ]]
}

openbuilds_get_electron_version() {
    [[ -f "${OPENBUILDS_PROJECT_DIR}/package.json" ]] || return 1

    (
        cd "${OPENBUILDS_PROJECT_DIR}"

        node -e '
            const pkg = require("./package.json");
            const value =
                pkg.devDependencies?.electron ||
                pkg.dependencies?.electron;

            if (!value) {
                process.exit(1);
            }

            console.log(value.replace(/^[^0-9]*/, ""));
        '
    )
}


openbuilds_verify() {
    local version
    local binding

    if ! openbuilds_is_installed; then
        log_warning "${OPENBUILDS_APP_NAME} is not installed correctly."
        return 1
    fi

    if ! node_is_installed || ! npm_is_installed; then
        log_error "Node.js and npm are required by ${OPENBUILDS_APP_NAME}."
        return 1
    fi

    binding="$(openbuilds_serialport_binding_path)"

    if [[ ! -f "${binding}" ]]; then
        log_warning "OpenBuilds SerialPort native binding is missing."
        return 1
    fi

    version="$(openbuilds_get_version)" || {
        log_error "Unable to read the ${OPENBUILDS_APP_NAME} version."
        return 1
    }

    log_success "${OPENBUILDS_APP_NAME} ${version} is installed."
}


_openbuilds_install_prerequisites() {
    log_info "Installing OpenBuilds build prerequisites..."

    sudo apt-get update

    sudo apt-get install -y \
        git \
        python3 \
        make \
        g++ \
        pkg-config \
        libudev-dev \
        libusb-1.0-0-dev
}


_openbuilds_clone_or_update() {
    if [[ -d "${OPENBUILDS_PROJECT_DIR}/.git" ]]; then
        log_info "Updating existing OpenBuilds CONTROL source..."

        git -C "${OPENBUILDS_PROJECT_DIR}" fetch --prune origin
        git -C "${OPENBUILDS_PROJECT_DIR}" pull --ff-only

    elif [[ -e "${OPENBUILDS_PROJECT_DIR}" ]]; then
        log_error \
            "${OPENBUILDS_PROJECT_DIR} exists but is not a Git repository."
        return 1

    else
        log_info "Cloning OpenBuilds CONTROL source..."

        git clone \
            --depth 1 \
            "${OPENBUILDS_REPOSITORY}" \
            "${OPENBUILDS_PROJECT_DIR}"
    fi
}


_openbuilds_install_dependencies() {
    log_info "Installing OpenBuilds CONTROL npm dependencies..."

    (
        cd "${OPENBUILDS_PROJECT_DIR}"

        npm install
        npm rebuild
        npm install --no-save electron-rebuild
        ./node_modules/.bin/electron-rebuild
    )
}


openbuilds_rebuild_serialport() {
    local electron_version

    electron_version="$(openbuilds_get_electron_version)" || {
        log_error "Unable to determine the Electron version."
        return 1
    }

    if ! openbuilds_is_armhf; then
        log_info \
            "Dedicated ARMv7 SerialPort rebuild is not required for $(openbuilds_get_architecture)."
        return 0
    fi

    log_info \
        "Rebuilding SerialPort native bindings for Electron ARMv7..."

    (
        cd "${OPENBUILDS_PROJECT_DIR}"

        rm -rf \
            node_modules/@serialport/bindings-cpp/build

        npm_config_build_from_source=true \
        npm_config_runtime=electron \
        npm_config_target="${electron_version}" \
        npm_config_arch=arm \
        npm_config_target_arch=arm \
        npm_config_arm_version=7 \
        npm_config_disturl=https://electronjs.org/headers \
        npm rebuild @serialport/bindings-cpp
    )

    if [[ ! -f "$(openbuilds_serialport_binding_path)" ]]; then
        log_error "SerialPort native binding rebuild failed."
        return 1
    fi

    log_success "SerialPort native bindings rebuilt successfully."
}


_openbuilds_install_shortcuts() {
    local source_file

    source_file="${OPENBUILDS_PROJECT_DIR}/pi-shortcut.desktop"

    if [[ ! -f "${source_file}" ]]; then
        log_warning "OpenBuilds desktop shortcut template was not found."
        return 0
    fi

    log_info "Installing OpenBuilds CONTROL application shortcut..."

    sudo install -Dm644 \
        "${source_file}" \
        "/usr/share/applications/${OPENBUILDS_DESKTOP_FILE}"

    if [[ -d "${HOME}/Desktop" ]]; then
        install -m644 \
            "${source_file}" \
            "${HOME}/Desktop/${OPENBUILDS_DESKTOP_FILE}"
    fi
}


openbuilds_install() {
    if openbuilds_verify >/dev/null 2>&1; then
        log_success \
            "${OPENBUILDS_APP_NAME} $(openbuilds_get_version) is already installed."
        return 0
    fi

    if ! node_verify >/dev/null 2>&1; then
        log_info "Node.js is required; installing it first."
        node_install
    fi

    if ! git_is_installed; then
        log_info "Git is required; installing it first."
        git_install
    fi

    _openbuilds_install_prerequisites
    _openbuilds_clone_or_update
    _openbuilds_install_dependencies
    openbuilds_rebuild_serialport
    _openbuilds_install_shortcuts

    if openbuilds_verify; then
        log_success "${OPENBUILDS_APP_NAME} installation completed."
    else
        log_error "${OPENBUILDS_APP_NAME} installation verification failed."
        return 1
    fi
}


openbuilds_launch() {
    if ! openbuilds_verify >/dev/null 2>&1; then
        log_error "${OPENBUILDS_APP_NAME} is not ready to launch."
        return 1
    fi

    if [[ -z "${DISPLAY:-}" ]]; then
        log_error \
            "${OPENBUILDS_APP_NAME} must be launched from the Raspberry Pi desktop."
        return 1
    fi

    log_info "Launching ${OPENBUILDS_APP_NAME}..."

    (
        cd "${OPENBUILDS_PROJECT_DIR}"
        npm run run-local
    )
}


openbuilds_remove() {
    if [[ ! -d "${OPENBUILDS_PROJECT_DIR}" ]]; then
        log_warning "${OPENBUILDS_APP_NAME} is not installed."
        return 0
    fi

    log_warning \
        "Removal is deliberately not automatic yet: ${OPENBUILDS_PROJECT_DIR}"

    return 1
}
