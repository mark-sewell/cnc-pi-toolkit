#!/usr/bin/env bash
#
# CNC Pi Toolkit
# Dashboard and kiosk installation module
#

set -Eeuo pipefail

dashboard_install() {
    local target_user
    local target_group
    local target_home
    local node_path
    local service_template
    local service_target="/etc/systemd/system/cnc-dashboard.service"
    local kiosk_script
    local autostart_dir
    local autostart_file
    local temporary_service
    local temporary_autostart
    local health_attempt

    log_info "Installing CNC Pi dashboard service and kiosk..."

    target_user="${CNC_PI_USER:-${SUDO_USER:-$(id -un)}}"

    if ! id "${target_user}" >/dev/null 2>&1; then
        log_error "Dashboard user does not exist: ${target_user}"
        return 1
    fi

    target_group="$(id -gn "${target_user}")"

    target_home="$(
        getent passwd "${target_user}" |
            cut -d: -f6
    )"

    if [[ -z "${target_home}" ]] || [[ ! -d "${target_home}" ]]; then
        log_error "Home directory was not found for ${target_user}."
        return 1
    fi

    node_path="$(command -v node || true)"

    if [[ -z "${node_path}" ]]; then
        log_error "Node.js was not found."
        return 1
    fi

    if ! command -v curl >/dev/null 2>&1; then
        log_error "curl is required by the kiosk launcher."
        return 1
    fi

    if ! command -v chromium >/dev/null 2>&1 &&
       ! command -v chromium-browser >/dev/null 2>&1; then
        log_warning "Chromium was not found; kiosk launch will be unavailable."
    fi

    service_template="${SCRIPT_DIR}/assets/systemd/cnc-dashboard.service.in"
    kiosk_script="${SCRIPT_DIR}/bin/cnc-pi-kiosk"

    if [[ ! -f "${service_template}" ]]; then
        log_error "Dashboard service template is missing."
        return 1
    fi

    if [[ ! -x "${kiosk_script}" ]]; then
        log_error "Kiosk launcher is missing or not executable."
        return 1
    fi

    if [[ ! -f "${SCRIPT_DIR}/dashboard/server.js" ]]; then
        log_error "Dashboard server was not found."
        return 1
    fi

    temporary_service="$(mktemp --suffix=.service)"

    sed \
        -e "s|@USER@|${target_user}|g" \
        -e "s|@GROUP@|${target_group}|g" \
        -e "s|@PROJECT_ROOT@|${SCRIPT_DIR}|g" \
        -e "s|@NODE@|${node_path}|g" \
        "${service_template}" \
        >"${temporary_service}"

    if command -v systemd-analyze >/dev/null 2>&1; then
        if ! systemd-analyze verify "${temporary_service}"; then
            log_error "Generated dashboard service is invalid."
            rm -f "${temporary_service}"
            return 1
        fi
    fi

    sudo install \
        -m 0644 \
        "${temporary_service}" \
        "${service_target}"

    rm -f "${temporary_service}"

    sudo systemctl daemon-reload
    sudo systemctl enable cnc-dashboard.service
    sudo systemctl restart cnc-dashboard.service

    autostart_dir="${target_home}/.config/labwc"
    autostart_file="${autostart_dir}/autostart"
    temporary_autostart="$(mktemp)"

    sudo install \
        -d \
        -o "${target_user}" \
        -g "${target_group}" \
        -m 0755 \
        "${autostart_dir}"

    if [[ -f "${autostart_file}" ]]; then
        awk '
            /^# CNC Pi Toolkit kiosk start$/ {
                managed = 1
                next
            }

            /^# End CNC Pi Toolkit kiosk start$/ {
                managed = 0
                next
            }

            managed {
                next
            }

            /^sleep 2$/ {
                next
            }

            /pkill.*wf-panel-pi/ {
                next
            }

            /chromium.*--kiosk.*localhost:8080/ {
                next
            }

            {
                print
            }
        ' "${autostart_file}" >"${temporary_autostart}"
    fi

    cat >>"${temporary_autostart}" <<EOF

# CNC Pi Toolkit kiosk start
"${kiosk_script}" &
# End CNC Pi Toolkit kiosk start
EOF

    sudo install \
        -o "${target_user}" \
        -g "${target_group}" \
        -m 0644 \
        "${temporary_autostart}" \
        "${autostart_file}"

    rm -f "${temporary_autostart}"

    for ((health_attempt = 1; health_attempt <= 20; health_attempt++)); do
        if curl \
            --fail \
            --silent \
            --show-error \
            --max-time 1 \
            "http://127.0.0.1:8080/" \
            >/dev/null 2>&1; then
            log_success "Dashboard service is healthy on port 8080."
            log_success "Dashboard service and Chromium kiosk installed."
            return 0
        fi

        sleep 0.5
    done

    log_error "Dashboard service did not pass its health check."

    sudo systemctl status cnc-dashboard.service \
        --no-pager -l || true

    return 1
}
