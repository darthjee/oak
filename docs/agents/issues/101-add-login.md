# Issue: Add Login

## Parent Issue

Sub-issue of #92 — Use React Front-End.

## Description

Add login and logoff capability to the React front-end. The `Header` shows a Login link when
the user is logged out and a Logoff link when logged in. Clicking Login opens a modal with a
username/password form. After a successful login or logoff the header reloads its state
(subscriptions + logged status) and the modal closes.

## Expected Behavior

- The `Header` (issue #94) displays:
  - "Login" link when not logged in — opens the login modal on click
  - "Logoff" link when logged in — calls `DELETE /users/logoff.json` and reloads the header
- The login modal contains:
  - Username and password fields
  - An error message when credentials are incorrect
  - A generic error message on unexpected server errors
  - "Cancel" button — closes the modal and clears the form
  - "Login" submit button — `POST /users/login.json` with `{ login, password }`
- On successful login: modal closes and the header reloads subscriptions and logged state
- On failed login (wrong credentials): shows an inline error, modal stays open
- On logoff: header reloads and shows the Login link again

## Solution

- Create a `LoginModal` element:
  - `frontend/assets/js/components/elements/LoginModal.jsx`
  - `frontend/assets/js/components/elements/controllers/LoginModalController.jsx` — handles form state and `POST /users/login.json`
  - `frontend/assets/js/components/elements/helpers/LoginModalHelper.jsx` — renders the Bootstrap modal
- Update `Header.jsx` to hold a `showModal` state and a `refreshKey` counter; pass handlers to `HeaderHelper`
- Update `HeaderController.jsx` to handle logoff (`DELETE /users/logoff.json`) and increment `refreshKey`
- Update `HeaderHelper.jsx` to render `<LoginModal>` and wire Login/Logoff click handlers
- Add `refreshKey` to the `useEffect` dependency array so the header re-fetches on change

## Reference

- Current AngularJS login modal: `source/app/views/layouts/_login.html.erb`
- Login route: `POST /users/login.json`
- Logoff route: `DELETE /users/logoff.json`

## Benefits

- Completes the authentication flow in the new React SPA
- The `refreshKey` pattern is a clean, reusable way to force a re-fetch without a global store

---
See issue for details: https://github.com/darthjee/oak/issues/101
