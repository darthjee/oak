# Update the docs index

Add one row per new file to the table in `docs/agents/summary.md`, in the same style as the existing `Architecture`/`Routes` rows (short description, relative link), placed near those entries since photo upload is architecturally adjacent to them.

Example rows to add (adjust wording to match the final Step 2 content):

```markdown
| [Photo Upload](photo_upload/index.md) | Overview of the Init/Submit/Finalize HTTP photo upload flow and proxy/backend/frontend ownership; links to contracts, data model, proxy/auth, and edge-case detail pages. |
| [Photo Upload — Contracts](photo_upload/contracts.md) | Concrete routes and request/response shapes for Init, Submit, and the shared status-gate/Finalize endpoint. |
| [Photo Upload — Data Model & Migration](photo_upload/data-model-and-migration.md) | The `ready` column, its two-step migration rollout, and `CreateItemPhotosJob`/controller filtering changes. |
| [Photo Upload — Proxy & Auth](photo_upload/proxy-and-auth.md) | The Tent extension mechanism, the new `proxy/` folder's agent ownership, session-cookie reuse, and upload validation. |
| [Photo Upload — Edge Cases & Coexistence](photo_upload/edge-cases-and-coexistence.md) | Abandoned-upload/duplicate handling, and how the new flow coexists with the existing scan-job ingestion. |
```

## Files to Change

- `docs/agents/summary.md` — add rows for the 5 new `docs/agents/photo_upload/*.md` files
