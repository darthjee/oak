# Plan: Non-literal fs existsSync argument in index_html_spec.js:8 (security/detect-non-literal-fs-filename)

Issue: [308-non-literal-fs-existssync-argument-in-index-html-spec-js-8-security-detect-non-literal-fs-filename.md](../issues/308-non-literal-fs-existssync-argument-in-index-html-spec-js-8-security-detect-non-literal-fs-filename.md)

## Overview
Suppress a Codacy false-positive security finding on the `existsSync` call in `frontend/spec/components/index_html_spec.js`, mirroring the fix already applied to the `readFileSync` call one line above in the same file (issues #305/#306).

See [frontend.md](frontend.md) for the full plan.
