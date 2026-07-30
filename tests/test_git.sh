#!/usr/bin/env bash
#
# Test Git module
#

set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

source "${PROJECT_ROOT}/lib/logging.sh"
source "${PROJECT_ROOT}/lib/git.sh"

git_is_installed
git_get_version >/dev/null
git_verify >/dev/null
