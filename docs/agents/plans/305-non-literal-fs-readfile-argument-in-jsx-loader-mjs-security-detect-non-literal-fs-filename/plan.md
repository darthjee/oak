# Plan: Non-literal fs readFile argument in jsx-loader.mjs (security/detect-non-literal-fs-filename)

Issue: [305-non-literal-fs-readfile-argument-in-jsx-loader-mjs-security-detect-non-literal-fs-filename.md](../../issues/305-non-literal-fs-readfile-argument-in-jsx-loader-mjs-security-detect-non-literal-fs-filename.md)

## Overview
Suppress the Codacy false-positive Security finding on `frontend/spec/support/jsx-loader.mjs:52` with a narrowly-scoped, justified `eslint-disable-next-line` comment, matching the precedent already set for issue #282.

See [frontend.md](frontend.md) for the full plan.
