# Plan: Backend — unique filename generation on photo upload

Issue: [262-backend-unique-filename-generation-on-photo-upload.md](../issues/262-backend-unique-filename-generation-on-photo-upload.md)

## Overview

Fix the `file_name` "already taken" collision on photo upload by making the
backend generate a unique, sanitized `file_name` at Init time instead of
trusting the client's raw filename. Entirely backend work (`source/`) — no
proxy or frontend changes needed.

See [backend.md](backend.md) for the full plan.
