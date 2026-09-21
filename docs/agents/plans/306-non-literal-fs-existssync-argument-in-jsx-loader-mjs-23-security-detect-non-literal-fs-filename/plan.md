# Plan: Non-literal fs existsSync argument in jsx-loader.mjs:23 (security/detect-non-literal-fs-filename)

Issue: [306-non-literal-fs-existssync-argument-in-jsx-loader-mjs-23-security-detect-non-literal-fs-filename.md](../../issues/306-non-literal-fs-existssync-argument-in-jsx-loader-mjs-23-security-detect-non-literal-fs-filename.md)

## Overview
Suppress a Codacy false-positive security finding on the `existsSync` call in
`frontend/spec/support/jsx-loader.mjs`'s `resolve()` hook, mirroring the fix
already applied to the sibling `readFile` call in the same file under #305
(PR #316).

See [frontend.md](frontend.md) for the full plan.
