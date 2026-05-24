# Issue: Build Header

## Parent Issue

Sub-issue of #92 — Use React Front-End.

## Description

Build the navigation header component for the new React front-end, replacing the AngularJS header defined in `source/app/views/layouts/_header.html.erb`.

## Problem

- The current header is an AngularJS component that will not work in the new React SPA
- A React equivalent must be built as part of the new front-end introduced in issue #93

## Expected Behavior

- A `Header` React component is rendered at the top of the page
- On load, the header checks whether the user is currently logged in (`GET /users/login.json`)
- The header fetches the user's subscribed categories (`GET /user/categories.json`) and displays them as menu items
- A "Categories" dropdown contains:
  - A "New" link (visible only when logged in)
  - An "All" link (always visible)
  - One link per subscribed category
- Login/Logoff links are shown or hidden based on the logged-in state
- The login modal itself will be added in a separate issue

## Solution

- Create `frontend/assets/js/components/elements/Header.jsx` — state + wiring
- Create `frontend/assets/js/components/elements/controllers/HeaderController.jsx` — fetches login status and subscriptions, provides handlers
- Create `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx` — renders navbar, dropdown, login/logoff links
- Follow the three-layer component pattern documented in `docs/agents/frontend.md`

## Benefits

- Gives the new React SPA a functional navigation bar consistent with the existing app's behavior
- Keeps the header logic isolated and testable

---
See issue for details: https://github.com/darthjee/oak/issues/94
