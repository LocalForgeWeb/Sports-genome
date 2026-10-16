#!/bin/sh
# SEC01/SEC05 on a local, isolated PostgreSQL: builds the live-equivalent copy from
# supabase/prepared/backend_v1/validation (synthetic athletes only), runs access-matrix.sql on the
# schema as it is live, applies the prepared Backend V1 migrations, runs it again, then drops the
# database. Never touches a remote project.
# Usage: sh docs/infrastructure-v2/probes/access-matrix.sh -h <socket dir> -p 55432 -U postgres
set -e
here="$(cd "$(dirname "$0")" && pwd)"
v1="$here/../../../supabase/prepared/backend_v1"
db=sg_access_matrix
psql "$@" -q -d postgres -c "drop database if exists $db" -c "create database $db"
run() { psql "$@" -q -v ON_ERROR_STOP=1 -d $db; }
run "$@" -f "$v1/validation/bootstrap.sql"
run "$@" -f "$v1/validation/seed.sql"
echo "== as live today"
run "$@" -f "$here/access-matrix.sql"
for m in "$v1"/2026*.sql; do run "$@" -f "$m" >/dev/null 2>&1; done
echo "== after the prepared Backend V1 migrations"
run "$@" -f "$here/access-matrix.sql"
psql "$@" -q -d postgres -c "drop database $db"
