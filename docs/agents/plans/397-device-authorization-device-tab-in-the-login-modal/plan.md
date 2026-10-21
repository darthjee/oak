# Plan: Device authorization: device tab in the login modal

Issue: [397-device-authorization-device-tab-in-the-login-modal.md](../../issues/397-device-authorization-device-tab-in-the-login-modal.md)

## Overview
Add a `device` mode ("Authorize with logged device") to the login modal: create an authorization request, poll it every 5s until another device approves or denies it, and show the waiting/result panels. Frontend only.

See [frontend.md](frontend.md) for the full plan.
