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
    cat <<EOF
CNC Pi Toolkit

Usage:
    ./cnc install
    ./cnc diagnostics
    ./cnc test
    ./cnc version
EOF
}

case "${1:-}" in
    install)
        ./install.sh
        ;;

    diagnostics)
        diagnostics_run
        ;;

    test)
        ./tests/run-tests.sh
        ;;

    version)
        echo "CNC Pi Toolkit v0.4.0"
        ;;

    ""|-h|--help|help)
        usage
        ;;

    *)
        echo "Unknown command: $1"
        usage
        exit 1
        ;;
esac
