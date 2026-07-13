#!/usr/bin/env bash
set -uo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
gate="$script_dir/coverage-gate.sh"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

failures=0

write_lcov() {
  printf 'LF:%s\nLH:%s\n' "$1" "$2" > "$3"
}

assert_exit() {
  local description="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "ok   - $description"
  else
    echo "FAIL - $description (expected exit $expected, got $actual)"
    failures=$((failures + 1))
  fi
}

cov_80="$work/cov_80.info"
write_lcov 100 80 "$cov_80"
cov_90="$work/cov_90.info"
write_lcov 100 90 "$cov_90"

baseline_80="$work/baseline_80.txt"
echo "80.00" > "$baseline_80"
baseline_90="$work/baseline_90.txt"
echo "90.00" > "$baseline_90"
baseline_within_tolerance="$work/baseline_within.txt"
echo "80.05" > "$baseline_within_tolerance"

GITHUB_OUTPUT=/dev/null bash "$gate" "$cov_80" "$work/absent.txt" >/dev/null 2>&1
assert_exit "missing baseline passes" 0 $?

GITHUB_OUTPUT=/dev/null bash "$gate" "$cov_90" "$baseline_80" >/dev/null 2>&1
assert_exit "coverage increase passes" 0 $?

GITHUB_OUTPUT=/dev/null bash "$gate" "$cov_80" "$baseline_80" >/dev/null 2>&1
assert_exit "unchanged coverage passes" 0 $?

GITHUB_OUTPUT=/dev/null bash "$gate" "$cov_80" "$baseline_within_tolerance" >/dev/null 2>&1
assert_exit "drop within tolerance passes" 0 $?

GITHUB_OUTPUT=/dev/null COVERAGE_ENFORCE=true bash "$gate" "$cov_80" "$baseline_90" >/dev/null 2>&1
assert_exit "drop beyond tolerance fails when enforced" 1 $?

GITHUB_OUTPUT=/dev/null COVERAGE_ENFORCE=false bash "$gate" "$cov_80" "$baseline_90" >/dev/null 2>&1
assert_exit "drop beyond tolerance passes when not enforced" 0 $?

GITHUB_OUTPUT=/dev/null COVERAGE_TOLERANCE=15 COVERAGE_ENFORCE=true bash "$gate" "$cov_80" "$baseline_90" >/dev/null 2>&1
assert_exit "drop inside custom tolerance passes" 0 $?

GITHUB_OUTPUT=/dev/null bash "$gate" "$work/does-not-exist.info" "$baseline_80" >/dev/null 2>&1
assert_exit "missing lcov report fails" 1 $?

output_file="$work/output.txt"
GITHUB_OUTPUT="$output_file" bash "$gate" "$cov_80" "$work/absent.txt" >/dev/null 2>&1
if grep -qx "current=80.00" "$output_file"; then
  echo "ok   - reports current coverage on output"
else
  echo "FAIL - reports current coverage on output (got: $(cat "$output_file"))"
  failures=$((failures + 1))
fi

if [[ "$failures" -gt 0 ]]; then
  echo "$failures test(s) failed"
  exit 1
fi

echo "all coverage-gate tests passed"
