#!/usr/bin/env python3
"""
Keeps docs/backend-v1/status.md honest without hand-editing a 300-row table.

    python3 docs/backend-v1/status_tool.py set B001 verified "evidence text"
    python3 docs/backend-v1/status_tool.py set B115,B116 implementing "note"
    python3 docs/backend-v1/status_tool.py show B115
    python3 docs/backend-v1/status_tool.py summary        # rewrites the summary block

`set` replaces the status and the evidence/note cell of each row named and then
rewrites the summary. A status outside the vocabulary is refused, and so is any
change to a row the owner deferred, so a payment item cannot quietly become
"pending" or "verified".
"""
import re
import sys
from collections import Counter
from pathlib import Path

STATUS_FILE = Path(__file__).with_name("status.md")
VOCABULARY = [
    "pending", "implementing", "implemented-unverified", "verified", "blocked",
    "deferred (owner)", "deferred", "confirmed-existing",
]
ROW = re.compile(r"^\| (B\d{3}) \| (.*?) \| (.*?) \| (.*?) \|$")


def load() -> list[str]:
    return STATUS_FILE.read_text().splitlines()


def save(lines: list[str]) -> None:
    STATUS_FILE.write_text("\n".join(lines) + "\n")


def summarise(lines: list[str]) -> list[str]:
    counts = Counter()
    for line in lines:
        match = ROW.match(line)
        if match:
            counts[match.group(3)] += 1
    total = sum(counts.values())
    body = [f"{total} requirements."] + [f"- `{status}`: {counts[status]}" for status in VOCABULARY if counts[status]]
    start = lines.index("<!-- summary:start -->")
    end = lines.index("<!-- summary:end -->")
    return lines[: start + 1] + body + lines[end:]


def set_rows(ids: list[str], status: str, note: str) -> None:
    if status not in VOCABULARY:
        sys.exit(f"unknown status {status!r}; use one of {VOCABULARY}")
    lines = load()
    wanted = set(ids)
    for index, line in enumerate(lines):
        match = ROW.match(line)
        if not match or match.group(1) not in wanted:
            continue
        rid, requirement, current, _old = match.groups()
        if current == "deferred (owner)" and status != "deferred (owner)":
            sys.exit(f"{rid} is deferred by the owner; change that only on the owner's instruction")
        lines[index] = f"| {rid} | {requirement} | {status} | {note.replace('|', '/')} |"
        wanted.discard(rid)
    if wanted:
        sys.exit(f"no row for {sorted(wanted)}")
    save(summarise(lines))


def main() -> None:
    if len(sys.argv) >= 2 and sys.argv[1] == "summary":
        save(summarise(load()))
    elif len(sys.argv) == 3 and sys.argv[1] == "show":
        for line in load():
            match = ROW.match(line)
            if match and match.group(1) in sys.argv[2].split(","):
                print(line)
    elif len(sys.argv) == 5 and sys.argv[1] == "set":
        set_rows(sys.argv[2].split(","), sys.argv[3], sys.argv[4])
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
