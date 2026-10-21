# Plan: Login modal event bus and Account dropdown

Issue: [396-login-modal-event-bus-and-account-dropdown.md](../../issues/396-login-modal-event-bus-and-account-dropdown.md)

## Overview
Frontend-only shell for the device authorization epic (#391): a `LoginModalEvents` bus that any
component can use to open or close the login modal, Header listening to it (ignored while logged
in) and passing a `mode` prop to `LoginModal`, an **Account** dropdown (Authorizations + Logoff)
replacing the navbar Logoff link, and an `authorizations` hash route with a placeholder page.

See [frontend.md](frontend.md) for the full plan.
