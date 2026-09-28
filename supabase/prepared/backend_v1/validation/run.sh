#!/bin/sh
# Validates the prepared Backend V1 migrations against a local copy of the live schema.
# Usage: run.sh <psql connection args>   e.g. run.sh -h /home/pgv/pg -p 55432 -U postgres
# Creates and drops its own database; never touches a remote project.
set -e
here="$(cd "$(dirname "$0")" && pwd)"
db=backend_v1_validation
psql "$@" -q -d postgres -c "drop database if exists $db" -c "create database $db"
run() { psql "$@" -q -v ON_ERROR_STOP=1 -d $db; }
run "$@" -f "$here/bootstrap.sql"
run "$@" -f "$here/seed.sql"
echo "== live schema: the holes are open"
run "$@" -f "$here/before.sql"
echo "== applying prepared migrations"
for m in "$here"/../2026*.sql; do echo "   $(basename "$m")"; run "$@" -f "$m"; done
echo "== after the migrations: closed, and legitimate writes still work"
run "$@" -f "$here/after.sql"
echo "== re-applying the migrations is harmless"
for m in "$here"/../2026*.sql; do run "$@" -f "$m"; done
run "$@" -f "$here/after.sql" >/dev/null
psql "$@" -q -d postgres -c "drop database $db"
echo "ALL VALIDATION PASSED"
