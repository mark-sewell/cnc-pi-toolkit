#!/usr/bin/env bash
#
# CNC Pi Toolkit
# Main command-line interface
#

set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

source "${PROJECT_ROOT}/lib/colors.sh"
source "${PROJECT_ROOT}/lib/logging.sh"
source "${PROJECT_ROOT}/lib/system.sh"
source "${PROJECT_ROOT}/lib/git.sh"
source "${PROJECT_ROOT}/lib/node.sh"
source "${PROJECT_ROOT}/lib/serial.sh"
source "${PROJECT_ROOT}/lib/serial_io.sh"

source "${PROJECT_ROOT}/modules/openbuilds.sh"
source "${PROJECT_ROOT}/modules/grbl.sh"
source "${PROJECT_ROOT}/modules/diagnostics.sh"

usage() {
    cat <<'EOF'
CNC Pi Toolkit

Usage:
    ./cnc install
    ./cnc diagnostics
    ./cnc test
    ./cnc version
    ./cnc status
EOF
}

case "${1:-}" in
    install)
        "${PROJECT_ROOT}/install.sh"
        ;;

    diagnostics)
        diagnostics_run
        ;;

    test)
        "${PROJECT_ROOT}/tests/run-tests.sh"
        ;;

    version)
        echo "CNC Pi Toolkit v0.4.0"
        ;;

    status)
        port="$(grbl_find_port || true)"

        if [[ -z "${port}" ]]; then
            log_error "No GRBL serial device was detected."
            exit 1
        fi

        if fuser "${port}" >/dev/null 2>&1; then
            log_error "Serial port ${port} is busy. Close OpenBuilds CONTROL first."
            exit 1
        fi

        grbl_probe "${port}"
        ;;

    ""|-h|--help|help)
        usage
        ;;

    *)
        echo "Unknown command: $1"
        echo
        usage
        exit 1
        ;;
esac
