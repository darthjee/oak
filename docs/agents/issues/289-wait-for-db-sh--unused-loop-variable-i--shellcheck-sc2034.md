# wait_for_db.sh: unused loop variable I (shellcheck SC2034)

## Context

Codacy (shellcheck `SC2034`, category ErrorProne) flags `source/scripts/wait_for_db.sh:3`:

```sh
for I in {1..30}; do
```

`I` is never used inside the loop body. Either use it (e.g. in a log/retry message) or make it explicit that it's intentionally unused (e.g. `for _ in $(seq 1 30); do`).

_Found via Codacy static analysis._

## What needs to be done

- Backend: update `source/scripts/wait_for_db.sh` so the loop no longer declares an unused variable — either replace `for I in {1..30}; do` with `for _ in $(seq 1 30); do` (explicitly marking it unused), or start using `I` in a retry/log message inside the loop body.
- Verify the script's behavior (waiting for the MySQL host/port to become reachable, exiting 0 on success and 1 on timeout) is unchanged.

## Acceptance criteria

- [ ] `source/scripts/wait_for_db.sh` no longer triggers shellcheck `SC2034` for an unused loop variable.
- [ ] The script's retry/wait/exit-code behavior is unchanged.
