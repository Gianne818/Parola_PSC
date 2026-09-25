#!/usr/bin/env python3
"""Fallback staged/tracked secret scanner (stdlib only).

Used by .githooks/pre-commit when the real `gitleaks` binary is not installed,
and by CI (.github/workflows/ci.yml) as a deterministic secret-scan step that
does not depend on git history.

Mirrors the philosophy of .gitleaks.toml: example placeholders and test
fixtures are allowlisted; anything that looks like a real credential fails.

Usage:
    python scripts/secret-scan.py --staged    # files staged for commit (hook)
    python scripts/secret-scan.py --tracked   # all git-tracked files (CI)
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys

# Paths that never contain real secrets (mirrors .gitleaks.toml [allowlist] paths).
ALLOWLIST_PATH_RES = [
    re.compile(r"\.env\.example$"),
    re.compile(r"\.env\..*\.example$"),
    re.compile(r"(^|/)\.githooks/"),
    re.compile(r"\.test\.ts$"),
    re.compile(r"(^|/)tests/run_all_tests\.js$"),
    re.compile(r"(^|/)scripts/secret-scan\.py$"),
    re.compile(r"(^|/)\.gitleaks\.toml$"),
]

# Placeholder-shaped values that are never real secrets.
PLACEHOLDER_RES = [
    re.compile(r"YOUR_[A-Z0-9_]+_HERE"),
    re.compile(r"your_[a-z0-9_]+_here"),
    re.compile(r"correct-admin-key-123"),
    re.compile(r"test-webhook-secret"),
    re.compile(r"(?i)^(example|sample|placeholder|dummy|changeme)[\-_a-z0-9]*$"),
]

# High-confidence secret patterns: (rule_id, regex against the secret value).
SECRET_RES = [
    ("aws-access-key-id", re.compile(r"AKIA[0-9A-Z]{16}")),
    ("private-key", re.compile(r"-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----")),
    ("supabase-jwt", re.compile(r"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+")),
    ("generic-assignment", re.compile(
        r"(?i)(api[_-]?key|secret|passwd|password|token)\s*[:=]\s*['\"]?([A-Za-z0-9_\-+/=]{20,})['\"]?"
    )),
]


def looks_like_secret(value: str) -> bool:
    """Length + charset heuristic for assigned credential values."""
    v = value.strip().strip("\"'")
    if len(v) < 20:
        return False
    classes = sum((
        bool(re.search(r"[a-z]", v)),
        bool(re.search(r"[A-Z]", v)),
        bool(re.search(r"[0-9]", v)),
        bool(re.search(r"[^A-Za-z0-9]", v)),
    ))
    return classes >= 3


def is_allowlisted(path: str) -> bool:
    return any(rx.search(path.replace("\\", "/")) for rx in ALLOWLIST_PATH_RES)


def is_placeholder(value: str) -> bool:
    return any(rx.search(value) for rx in PLACEHOLDER_RES)


def git_files(mode: str) -> list[str]:
    if mode == "staged":
        cmd = ["git", "diff", "--cached", "--name-only", "-z", "--diff-filter=ACMRT"]
    else:
        cmd = ["git", "ls-files", "-z"]
    out = subprocess.run(cmd, capture_output=True, check=True).stdout.decode("utf-8", "replace")
    return [p for p in out.split("\0") if p]


def file_lines(path: str) -> list[str] | None:
    try:
        # utf-8-sig transparently strips a BOM if present.
        with open(path, "r", encoding="utf-8-sig", errors="strict") as fh:
            return fh.read().splitlines()
    except (OSError, UnicodeError):
        return None  # binary / unreadable — skip


def scan_file(path: str, lines: list[str]) -> list[str]:
    findings: list[str] = []
    for lineno, line in enumerate(lines, start=1):
        if is_placeholder(line):
            continue
        for rule_id, rx in SECRET_RES:
            for match in rx.finditer(line):
                secret = match.group(0)
                if is_placeholder(secret):
                    continue
                if rule_id == "generic-assignment":
                    value = match.group(2)
                    if not looks_like_secret(value):
                        continue
                findings.append(f"{path}:{lineno}: [{rule_id}] {line.strip()[:120]}")
                break
    return findings


def main() -> int:
    # Never traceback on console-encoding issues (e.g. cp1252 on Windows):
    # findings must print even when they contain non-encodable characters.
    try:
        sys.stdout.reconfigure(errors="backslashreplace")
    except Exception:
        pass
    parser = argparse.ArgumentParser(description="Fallback secret scanner.")
    parser.add_argument("--staged", action="store_true", help="scan files staged for commit")
    parser.add_argument("--tracked", action="store_true", help="scan all git-tracked files")
    args = parser.parse_args()
    mode = "tracked" if args.tracked else "staged"

    try:
        paths = git_files(mode)
    except subprocess.CalledProcessError as exc:
        print(f"secret-scan: git failed: {exc}", file=sys.stderr)
        return 2

    findings: list[str] = []
    scanned = 0
    for path in paths:
        if is_allowlisted(path):
            continue
        lines = file_lines(path)
        if lines is None:
            continue
        scanned += 1
        findings.extend(scan_file(path, lines))

    if findings:
        print(f"secret-scan: {len(findings)} potential secret(s) in {mode} files — blocking.")
        for finding in findings:
            print(f"  {finding}")
        print("If a finding is a placeholder, add it to .gitleaks.toml and scripts/secret-scan.py.")
        return 1
    print(f"secret-scan: clean ({scanned} files, {mode}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
