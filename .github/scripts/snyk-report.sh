#!/usr/bin/env bash
# Generate a markdown vulnerabilities report from a Snyk JSON output file.
# Usage: snyk-report.sh <snyk_test.json>
set -euo pipefail

input_file="${1:?Usage: $0 <snyk_test.json>}"

# Check if file exists
if [ ! -f "$input_file" ]; then
  echo "File not found! Cannot generate SNYK report!" >&2
  exit 1
fi

# Print the title and table headers
echo "# Vulnerabilities Report"
echo ""
echo "| ID                            | CVE              | Severity | CVSS Score | Package Name    |"
echo "|-------------------------------|------------------|----------|------------|-----------------|"

# Use jq to extract ID, CVE(s), Severity, CVSSScore, and Package name from vulnerabilities,
# then make sure the vulnerabilities are unique based on the ID.
# The ID is rendered as a markdown link to the Snyk advisory page.
# Multiple CVEs are joined into one cell; empty fields become "-" so read doesn't collapse tabs
jq -r '
  (if type == "array" then .[] else . end) | .vulnerabilities[] |
  select(.id != null) |    # Ensure ID exists
  ("[\(.id)](\(.url // "https://security.snyk.io/vuln/\(.id)"))") as $link |
  [$link, ((.identifiers.CVE // []) | join(", ")), .severity, .cvssScore, .packageName] |
  map(if . == null or . == "" then "-" else . end) |
  @tsv
' "$input_file" | awk '!seen[$1]++' | while IFS=$'\t' read -r id cve severity cvssScore packageName; do
  printf "| %-30s | %-16s | %-8s | %-10s | %-15s |\n" "$id" "$cve" "$severity" "$cvssScore" "$packageName"
done
