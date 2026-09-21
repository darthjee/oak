# Backend Plan: wait_for_db.sh: unused loop variable I (shellcheck SC2034)

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Replace the unused loop variable in wait_for_db.sh

`source/scripts/wait_for_db.sh` declares `for I in {1..30}; do` but never uses `I` inside the loop body, which trips shellcheck's `SC2034` (unused variable). Replace it with `for _ in $(seq 1 30); do`, which explicitly marks the loop variable as intentionally unused (the conventional shellcheck-friendly idiom) while preserving the exact retry count (30 iterations) and the existing wait/exit-code behavior (`sleep 1` between attempts, `exit 0` on success, `exit 1` after exhausting retries).

## Files to Change

- `source/scripts/wait_for_db.sh` — change `for I in {1..30}; do` to `for _ in $(seq 1 30); do`.

## Notes

- No CI job runs shellcheck locally in `.circleci/config.yml`; this finding comes from Codacy's static analysis integration. Verify locally with `shellcheck source/scripts/wait_for_db.sh` if available.
- `source/scripts/wait_for_db.sh` is invoked as `cd source && scripts/wait_for_db.sh` in `.circleci/config.yml` (line 143) — the fix must keep that invocation working unchanged.
