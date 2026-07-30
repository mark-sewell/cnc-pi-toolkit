#!/usr/bin/env bash
#
# CNC Pi Toolkit
# Test suite runner
#

set -uo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="${PROJECT_ROOT}/tests"

passed=0
failed=0

echo
echo "================================="
echo " CNC Pi Toolkit Test Suite"
echo "================================="
echo

for test_file in "${TEST_DIR}"/test_*.sh; do
    [[ -f "${test_file}" ]] || continue

    test_name="$(basename "${test_file}")"

    if bash "${test_file}"; then
        printf '[PASS] %s\n' "${test_name}"
        ((passed += 1))
    else
        printf '[FAIL] %s\n' "${test_name}"
        ((failed += 1))
    fi
done

echo
echo "================================="
printf '%d test(s) passed\n' "${passed}"
printf '%d test(s) failed\n' "${failed}"
echo "================================="

if (( failed > 0 )); then
    exit 1
fi
