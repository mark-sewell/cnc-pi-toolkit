
# Main installer entry point
=======
#
# 
#

set -Eeuo pipefail


SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"


# -------------------------------------------------
# Load libraries
# -------------------------------------------------

load_library() {
    local library="$1"

    if [[ -f "${SCRIPT_DIR}/lib/${library}.sh" ]]; then
        # shellcheck disable=SC1090
        source "${SCRIPT_DIR}/lib/${library}.sh"
    else
        echo "Missing library: ${library}.sh"
        exit 1
    fi
}


load_library "logging"
load_library "system"
load_library "node"


# -------------------------------------------------
# Basic installer functions
# -------------------------------------------------

installer_banner() {

    echo
    echo "================================="
    echo " CNC Pi Toolkit Installer"
    echo "================================="
    echo

}


installer_check() {

log_info "Checking system..."

log_success "Model: $(system_get_model)"
log_success "OS: $(system_get_os_name)"
log_success "Architecture: $(system_get_architecture)"
log_success "RAM: $(system_get_ram_mb) MB"

    if ! node_is_installed; then
        log_warning "Node.js not installed."
    else
       log_success "Node.js $(node_get_version)"
    fi

}


installer_main() {

    installer_banner

    installer_check

    echo
   log_success "Installer framework ready."
    echo

}


installer_main
=======
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load libraries
source "${PROJECT_ROOT}/lib/common.sh"
source "${PROJECT_ROOT}/lib/colors.sh"
source "${PROJECT_ROOT}/lib/logging.sh"
source "${PROJECT_ROOT}/lib/system.sh"
source "${PROJECT_ROOT}/lib/network.sh"
source "${PROJECT_ROOT}/lib/packages.sh"

main() {

    print_banner

    init_logging

    system_init

    headline "System Summary"

    print_system_summary

    echo

    headline "Network"

    if wait_for_network; then
        success "Network connectivity verified."
    else
        error "Internet connectivity check failed."
        exit 1
    fi

    echo

    headline "Dependency Check"

    verify_dependencies \
        git \
        curl \
        wget \
        bash

    echo

    success "Framework initialisation completed."

    info "OpenBuilds installer module will be added in the next milestone."

}

main "$@"


