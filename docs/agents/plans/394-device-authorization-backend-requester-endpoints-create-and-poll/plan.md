# Plan: Device authorization: backend requester endpoints (create and poll)

Issue: [394-device-authorization-backend-requester-endpoints-create-and-poll.md](../../issues/394-device-authorization-backend-requester-endpoints-create-and-poll.md)

## Overview
Add the `authorization_requests` table and `AuthorizationRequest` model, four settings, and the two public requester endpoints (`create` and `poll`) under `/auth/authorization-requests`. The winning poll mints a session through the existing `LoggedUser::Processor#login(user, keep_signed_in:)` (merged in #393). Backend only.

See [backend.md](backend.md) for the full plan.
