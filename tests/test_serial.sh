#!/usr/bin/env bash
#
# Test Serial module
#

set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

source "${PROJECT_ROOT}/lib/logging.sh"
source "${PROJECT_ROOT}/lib/serial.sh"

# Verify exported functions.
type serial_verify >/dev/null
type serial_get_first_device >/dev/null
type serial_list_devices >/dev/null

# Exercise the library.
serial_list_devices >/dev/null || true
serial_get_first_device >/dev/null || true
serial_verify >/dev/null || true
#!/usr/bin/env bash
#
# Test Serial module
#

set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

source "${PROJECT_ROOT}/lib/logging.sh"
source "${PROJECT_ROOT}/lib/serial.sh"

# Verify exported functions.
type serial_verify >/dev/null
type serial_get_first_device >/dev/null
type serial_list_devices >/dev/null

# Exercise the library.
serial_list_devices >/dev/null || true
serial_get_first_device >/dev/null || true
serial_verify >/dev/null || true

exit 0
