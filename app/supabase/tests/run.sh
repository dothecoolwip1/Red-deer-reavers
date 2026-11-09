#!/usr/bin/env bash
# Runs the migration against a throwaway local Postgres with stand-ins for the BuhurtOS pieces it uses
# (auth.uid, private.is_owner/is_team_captain/is_team_member, team_officers, storage), then checks who can do what.
# Usage: PGHOST=... PGPORT=... PGUSER=postgres app/supabase/tests/run.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
db="reavers_app_test_$$"
psql -X -q -v ON_ERROR_STOP=1 -c "create database $db" >/dev/null
trap 'psql -X -q -c "drop database if exists $db" >/dev/null' EXIT
run() { psql -X -q -v ON_ERROR_STOP=1 -d "$db" "$@"; }
run -f "$here/stubs.sql"
run -f "$here/../migrations/20261109000000_reavers_app.sql"
run -c "grant usage on schema public to authenticated; grant select,insert,update,delete on all tables in schema public to authenticated; grant select,insert on storage.objects to authenticated;"
actual="$(psql -X -q -t -A -d "$db" -f "$here/rls.sql" 2>&1 | grep -v '^0000' | sed -E 's/^psql:[^:]+:[0-9]+: //' | grep -v '^CONTEXT')"
if diff <(echo "$actual") "$here/rls.expected"; then echo "RLS checks passed"; else echo "RLS checks FAILED (diff above)"; exit 1; fi
