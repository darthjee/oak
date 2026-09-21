# Plan: Non-literal fs readFileSync argument in index_html_spec.js (security/detect-non-literal-fs-filename)

Issue: [307-non-literal-fs-readfilesync-argument-in-index-html-spec-js-security-detect-non-literal-fs-filename.md](../../issues/307-non-literal-fs-readfilesync-argument-in-index-html-spec-js-security-detect-non-literal-fs-filename.md)

## Overview
Suppress the Codacy false-positive `security/detect-non-literal-fs-filename` finding on `frontend/spec/components/index_html_spec.js:5` with a justified disable comment, reusing the inert local ESLint stub already established in `frontend/eslint.config.mjs` for the same rule under #305.

See [frontend.md](frontend.md) for the full plan.
