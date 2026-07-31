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

branding_install_plymouth_theme() {
    local theme_name="cnc-pi-animated"
    local theme_source="${SCRIPT_DIR}/assets/plymouth/${theme_name}"
    local theme_target="/usr/share/plymouth/themes/${theme_name}"
    local lightdm_override="/etc/systemd/system/lightdm.service.d"
    local delay="${CNC_PI_SPLASH_DELAY_SECONDS:-4}"
    local frame_count

    log_info "Installing animated CNC Pi Plymouth theme..."

    if ! command -v plymouth-set-default-theme >/dev/null 2>&1; then
        log_warning "Plymouth is not installed; animated branding skipped."
        return 0
    fi

    if [[ ! "${delay}" =~ ^[0-9]+$ ]]; then
        log_error "Invalid splash delay: ${delay}"
        return 1
    fi

    if [[ ! -f "${theme_source}/${theme_name}.plymouth" ]] ||
       [[ ! -f "${theme_source}/${theme_name}.script" ]]; then
        log_error "Plymouth theme files are incomplete."
        return 1
    fi

    frame_count="$(
        find "${theme_source}/frames" \
            -maxdepth 1 \
            -type f \
            -name 'frame-*.png' |
            wc -l
    )"

    if [[ "${frame_count}" -ne 24 ]]; then
        log_error "Expected 24 animation frames; found ${frame_count}."
        return 1
    fi

    sudo install -d -m 0755 "${theme_target}/frames"

    sudo install -m 0644 \
        "${theme_source}/${theme_name}.plymouth" \
        "${theme_source}/${theme_name}.script" \
        "${theme_target}/"

    sudo install -m 0644 \
        "${theme_source}"/frames/frame-*.png \
        "${theme_target}/frames/"

    if [[ -f /lib/systemd/system/lightdm.service ]]; then
        sudo install -d -m 0755 "${lightdm_override}"

        printf '[Service]\nExecStartPre=/bin/sleep %s\n' "${delay}" |
            sudo tee \
                "${lightdm_override}/cnc-pi-splash-delay.conf" \
                >/dev/null

        sudo systemctl daemon-reload
        log_info "LightDM splash delay set to ${delay} seconds."
    else
        log_warning "LightDM was not found; splash delay skipped."
    fi

    sudo plymouth-set-default-theme "${theme_name}"
    sudo update-initramfs -u

    log_success "Animated CNC Pi Plymouth theme installed."
}
