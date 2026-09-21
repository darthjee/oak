# Plan: wait_for_db.sh: unused loop variable I (shellcheck SC2034)

Issue: [289-wait-for-db-sh--unused-loop-variable-i--shellcheck-sc2034.md](../issues/289-wait-for-db-sh--unused-loop-variable-i--shellcheck-sc2034.md)

## Overview

Fix a shellcheck `SC2034` (unused variable) finding in `source/scripts/wait_for_db.sh`, where the loop variable `I` is never referenced inside the loop body.

See [backend.md](backend.md) for the full plan.
