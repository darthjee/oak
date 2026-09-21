# backend Plan: Quote shell variable expansions to fix ShellCheck SC2086 (4 occurrences)

Main plan: [plan.md](plan.md)

## Shared contracts

None.

## Implementation Steps

### Step 1 — Quote `$OAK_MYSQL_HOST`/`$OAK_MYSQL_PORT` in both `wait_for_db.sh` scripts

In both `source/scripts/wait_for_db.sh:4` and `source/bin/wait_for_db.sh:10`, quote the `telnet` argument expansions:

```bash
telnet $OAK_MYSQL_HOST $OAK_MYSQL_PORT
```

becomes:

```bash
telnet "$OAK_MYSQL_HOST" "$OAK_MYSQL_PORT"
```

No other unquoted expansions exist in either file (the other variable uses in `source/bin/wait_for_db.sh`, e.g. `${MAX_RETRIES:-30}` inside an arithmetic `for` and `"$RETRY_INTERVAL"`, are already safe/quoted).

## Files to Change

- `source/scripts/wait_for_db.sh` — quote `$OAK_MYSQL_HOST` and `$OAK_MYSQL_PORT` on line 4.
- `source/bin/wait_for_db.sh` — quote `$OAK_MYSQL_HOST` and `$OAK_MYSQL_PORT` on line 10.

## Notes

- Purely mechanical quoting fix; no behavior change expected since none of these variables are meant to contain whitespace or glob characters.
