# Issue: Quote shell variable expansions to fix ShellCheck SC2086 (4 occurrences)

## Problem
Codacy's ShellCheck integration flags 4 occurrences of SC2086 ("Double quote to prevent globbing and word splitting"), category BestPractice, severity Warning:

- `scripts/prod_shell.sh:10` — `setup_env $SERVICE_ID`
- `scripts/prod_shell.sh:35` — `get_env_vars $1 | \`
- `source/scripts/wait_for_db.sh:4` — `if ( echo "" | telnet $OAK_MYSQL_HOST $OAK_MYSQL_PORT | grep Escape ); then`
- `source/bin/wait_for_db.sh:10` — `if echo "" | telnet $OAK_MYSQL_HOST $OAK_MYSQL_PORT; then`

Unquoted variable expansions are subject to word splitting and pathname expansion, which can produce unintended behavior if the variable's value ever contains whitespace or glob characters.

## Solution
Quote each flagged variable expansion:
- `setup_env $SERVICE_ID` → `setup_env "$SERVICE_ID"`
- `get_env_vars $1` → `get_env_vars "$1"`
- `telnet $OAK_MYSQL_HOST $OAK_MYSQL_PORT` → `telnet "$OAK_MYSQL_HOST" "$OAK_MYSQL_PORT"` (both occurrences, in both `wait_for_db.sh` files)

While in `scripts/prod_shell.sh`, also quote the other unquoted variable expansions in the same file for consistency, even though Codacy didn't flag them:
- `docker-compose run $IMAGE /bin/bash` → `docker-compose run "$IMAGE" /bin/bash`
- `docker-compose up $IMAGE` → `docker-compose up "$IMAGE"`
- `case $ACTION in` → `case "$ACTION" in`
- `$ACTION` (default case, run as a command) → `"$ACTION"`

`source/scripts/wait_for_db.sh` and `source/bin/wait_for_db.sh` have no other unquoted expansions beyond the flagged line.

## Benefits
- Resolves the 4 Codacy/ShellCheck SC2086 warnings.
- Prevents unintended word-splitting/globbing if these variables ever contain whitespace or glob characters.
