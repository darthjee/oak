# Status Machine

Part of the [device authorization spec](../authorization.md). Used by #394, #395 and #397.

## States

The `status` column and every `status` field in JSON use exactly these strings:

| Status | Meaning |
|---|---|
| `open` | Created, waiting for an approver. |
| `approved` | An approver authorized it; no poll has claimed it yet. |
| `logged` | A poll claimed the approval and a session was created. Final. |
| `denied` | An approver denied it. Final. |
| `expired` | The request's time ran out, or it was evicted by the open-request cap. Final. |

## Transitions

```text
            create
              │
              ▼
          ┌──────┐  authorize   ┌──────────┐  first poll claims it  ┌────────┐
          │ open │ ───────────▶ │ approved │ ─────────────────────▶ │ logged │
          └──────┘              └──────────┘   (creates the session) └────────┘
           │    │
      deny │    │ expires_at passed / evicted by the open-request cap
           ▼    ▼
     ┌────────┐ ┌─────────┐
     │ denied │ │ expired │
     └────────┘ └─────────┘
```

| From | To | Trigger |
|---|---|---|
| `open` | `approved` | `authorize` with the correct password (#395). |
| `open` | `denied` | `deny` (#395). |
| `open` | `expired` | `expires_at` passed, or a newer request pushed the user over `authorization_request_max_open` (the **oldest** open request expires). |
| `approved` | `logged` | The **first** poll that sees `approved` (#394). |

- Every other transition is invalid. `authorize` / `deny` on a request that is not `open` (or is
  expired) answer `400` (see [http-contract.md](http-contract.md)).
- There is **no** `logged → denied` transition: Oak has no user deactivation (out of scope).
- An `approved` request whose `expires_at` passes before any poll claims it becomes `expired`.

## Expiry

- Expiry is **computed on read**: a request with `status` `open` or `approved` and
  `expires_at <= now` is treated as `expired` everywhere (poll result, `mine` list, authorize and
  deny checks). The backend may persist `expired` lazily when it touches the row; no job is needed.
- The **server's expiry is what counts**. The requester's countdown and local expiry timer are
  display only; they never decide the request's real state on the server.

## The atomic claim

Only the **first** poll that sees `approved` gets a session. The claim must be atomic on the
server: a single conditional update (`approved → logged` where `status = 'approved'`) whose
affected-row count decides the winner. The winner creates the session and answers
`{ status: "approved", session }`. Every other poll, including the requester's own later polls,
answers `{ status: "logged" }` with no cookie.

## Poll results (requester view)

| Poll result | Panel shown by the login modal |
|---|---|
| `{ status: "open" }` | `waiting` (poll again in 5s) |
| `{ status: "approved", session }` | modal closes through `onAuthSuccess` |
| `{ status: "denied" }` | `denied` |
| `{ status: "expired" }` | `expired` |
| `{ status: "logged" }` | `logged` |
| HTTP `404` | `notFound` (final) |
| Network error or other non-404 failure | stays on `waiting`, shows the "network error, retrying" alert, keeps polling |
| Local clock passes `expiresAt` | `expired`, no request sent |

`denied`, `expired`, `logged` and `notFound` are final: the poller stops. Panel names and their
behavior are detailed in [login-modal.md](login-modal.md).
