#!/usr/bin/env bash
#
# CNC Pi Toolkit
# Branding installation module
#

set -Eeuo pipefail

branding_install_terminal_banner() {
    local banner_source="${SCRIPT_DIR}/bin/cnc-pi-banner"
    local bashrc_file="${HOME}/.bashrc"
    local banner_marker="CNC Pi Toolkit terminal banner"

    log_info "Installing terminal banner..."

    if [[ ! -f "${banner_source}" ]]; then
        log_error "Terminal banner not found: ${banner_source}"
        return 1
    fi

    chmod +x "${banner_source}"

    if [[ ! -f "${bashrc_file}" ]]; then
        touch "${bashrc_file}"
    fi

    if grep -qF "${banner_marker}" "${bashrc_file}"; then
        log_info "Terminal banner is already enabled."
        return 0
    fi

    cat >> "${bashrc_file}" <<'EOF'

# CNC Pi Toolkit terminal banner
if [[ $- == *i* ]] && [[ -x "$HOME/cnc-pi-toolkit/bin/cnc-pi-banner" ]]; then
    "$HOME/cnc-pi-toolkit/bin/cnc-pi-banner"
fi
EOF

    log_success "Terminal banner installed."
}
