# architect Plan: Quote shell variable expansions to fix ShellCheck SC2086 (4 occurrences)

Main plan: [plan.md](plan.md)

## Shared contracts

None.

## Implementation Steps

### Step 1 — Quote variable expansions in `scripts/prod_shell.sh`

Quote the 2 Codacy-flagged expansions plus the other unquoted expansions in the same file, for consistency (per issue discussion — Codacy didn't flag these, but they're the same class of problem in the same file):

- Line 10: `setup_env $SERVICE_ID` → `setup_env "$SERVICE_ID"` (flagged)
- Line 15: `docker-compose run $IMAGE /bin/bash` → `docker-compose run "$IMAGE" /bin/bash`
- Line 26: `docker-compose up $IMAGE` → `docker-compose up "$IMAGE"`
- Line 35: `get_env_vars $1` → `get_env_vars "$1"` (flagged)
- Line 42: `case $ACTION in` → `case "$ACTION" in`
- Line 50: `$ACTION` (default case, run as a command) → `"$ACTION"`

## Files to Change

- `scripts/prod_shell.sh` — quote `$SERVICE_ID`, `$IMAGE` (both occurrences), `$1`, and `$ACTION` (both occurrences).

## Notes

- `scripts/` is a root-level folder not covered by any specialist agent's documented scope, so this file is handled directly by the architect rather than `backend`.
- Purely mechanical quoting fix; no behavior change expected.
