#!/bin/sh
# REC04: an encrypted, checksummed backup of the production database AND its media, made on the
# owner's own machine and kept in the owner's own private storage.
#
# Why here and not in CI: the Supabase project is on the Free plan, which keeps no automatic
# backups (Supabase recommends regular `supabase db dump` exports kept off-site), and this
# repository is PUBLIC, so a workflow artifact would be downloadable by anyone. Never commit or
# upload the output anywhere public.
#
# Needs: Supabase CLI (it runs pg_dump in Docker), Node 22+, gpg.
# Usage:
#   SUPABASE_DB_URL='<Session pooler connection string>' sh scripts/ops/backup.sh <output dir>
# gpg asks for the passphrase (or set BACKUP_PASSPHRASE). Keep the passphrase apart from the file.
# Restore and verification steps: docs/infrastructure-v2/recovery.md.
set -eu
: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL to the Session pooler connection string (Supabase dashboard > Connect)}"
out="${1:?usage: sh scripts/ops/backup.sh <output directory>}"
here="$(cd "$(dirname "$0")" && pwd)"
stamp="$(date -u +%Y%m%dT%H%MZ)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
if command -v sha256sum >/dev/null 2>&1; then sha="sha256sum"; else sha="shasum -a 256"; fi

mkdir -p "$work/backup"
supabase db dump --db-url "$SUPABASE_DB_URL" -f "$work/backup/roles.sql" --role-only
supabase db dump --db-url "$SUPABASE_DB_URL" -f "$work/backup/schema.sql"
supabase db dump --db-url "$SUPABASE_DB_URL" -f "$work/backup/data.sql" --use-copy --data-only
node "$here/storage-backup.mjs" "$work/backup/storage"
(cd "$work/backup" && find . -type f ! -name SHA256SUMS | sort | while read -r f; do $sha "$f"; done > SHA256SUMS)
tar -czf "$work/backup.tar.gz" -C "$work" backup

mkdir -p "$out"
target="$out/sports-genome-backup-$stamp.tar.gz.gpg"
if [ -n "${BACKUP_PASSPHRASE:-}" ]; then
  printf '%s' "$BACKUP_PASSPHRASE" | gpg --batch --yes --pinentry-mode loopback --passphrase-fd 0 --symmetric --cipher-algo AES256 -o "$target" "$work/backup.tar.gz"
else
  gpg --symmetric --cipher-algo AES256 -o "$target" "$work/backup.tar.gz"
fi
echo "wrote $target ($(wc -c < "$target" | tr -d ' ') bytes)"
