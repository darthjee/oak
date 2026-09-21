# Plan: Reduce parameter counts in CategoryItemEdit* components (frontend)

Issue: [290-reduce-parameter-counts-in-categoryitemedit-components-frontend.md](../issues/290-reduce-parameter-counts-in-categoryitemedit-components-frontend.md)

## Overview

Group the long positional parameter lists of `CategoryItemEditController`'s constructor and
`CategoryItemEditHelper.render`/`#renderPhotoSection` into option/props objects, update the two
call sites (`CategoryItemEdit.jsx`, `CategoryItemNew.jsx`) and the affected Jasmine specs
accordingly. This is a frontend-only, single-agent change.

See [frontend.md](frontend.md) for the full plan.
