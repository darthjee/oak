# Documentation Index

Index of every document under `docs/agents/`, each with a short description and a link — use this to judge relevance before opening a file.

| File | Description |
|------|-------------|
| [Folder Structure](folder-structure.md) | Top-level directory layout of the repository and the role of each folder, down to the first level inside `source/`, `frontend/`, `dockerfiles/`, `docker_volumes/`, and `docs/agents/`. |
| [Architecture](architecture/index.md) | Overview and frontend summary; links to infrastructure/request-routing and backend source layout. |
| [Architecture — Infrastructure](architecture/infrastructure.md) | Docker service topology and how frontend-serving requests route through the reverse proxy to Rails. |
| [Architecture — Backend Layout](architecture/backend-layout.md) | `source/app/` directory layout, key gems, and the template rendering pattern (pure JSON API). |
| [Flow](flow.md) | Main runtime flow: entry points, SPA page load, auxiliary routes, and two complete worked examples. |
| [Routes](routes/index.md) | How resource vs. utility routes are categorized; links to the full route tables. |
| [Routes — Resource Routes](routes/resource-routes.md) | Full table of SPA resource routes: Home, Categories, Items, Kinds, Admin — Users, Forbidden. |
| [Routes — Utility Routes](routes/utility-routes.md) | Full table of API-only utility routes: Session, User Navigation Data, Form Support, Subscriptions, Disabled/Pending Cleanup. |
| [Photo Upload](photo_upload/index.md) | Overview of the Init/Submit/Finalize HTTP photo upload flow and proxy/backend/frontend ownership; links to contracts, data model, proxy/auth, and edge-case detail pages. |
| [Photo Upload — Contracts](photo_upload/contracts.md) | Concrete routes and request/response shapes for Init, Submit, and the shared status-gate/Finalize endpoint. |
| [Photo Upload — Data Model & Migration](photo_upload/data-model-and-migration.md) | The `ready` column, its two-step migration rollout, and `CreateItemPhotosJob`/controller filtering changes. |
| [Photo Upload — Proxy & Auth](photo_upload/proxy-and-auth.md) | The Tent extension mechanism, the new `proxy/` folder's agent ownership, session-cookie reuse, and upload validation. |
| [Photo Upload — Edge Cases & Coexistence](photo_upload/edge-cases-and-coexistence.md) | Abandoned-upload/duplicate handling, and how the new flow coexists with the existing scan-job ingestion. |
| [Photo in Production — Guide](specs/photo/index.md) | Temporary (#328): storage layout (`origin/`, `photos/`, `snaps/`), the path decision and serving invariant, and the #330–#337 sub-issue map. |
| [Photo in Production — Proxy Rules](specs/photo/proxy-rules.md) | Temporary (#328): versioned prod Tent config, `locals.php` variables, rule order, static `/photos` and `/snaps` rules, dev vs prod values. |
| [Photo in Production — Deployment](specs/photo/deployment.md) | Temporary (#328): CircleCI `upload_proxy_files` changes, the `link_photos` job, env vars and the on-disk release layout. |
| [Photo in Production — Resizing](specs/photo/resizing.md) | Temporary (#328): GD resizing on submit (origin, photos, snaps), shrink-only fit, failure handling, delete of all three files, and specs. |
| [Photo in Production — Rollout](specs/photo/rollout.md) | Temporary (#328): ship order, the #251 file migration, the `OAK_PHOTOS_SERVER_URL` switch and the prod checklist. |
| [Photo in Production — Examples](specs/photo/examples.md) | Temporary (#328): proposed PHP rules, `locals.php.sample` and CircleCI job snippets for the guide pages. |
| [Front-End](frontend/index.md) | Runtime boot flow, directory structure, and Pages vs. Elements; links to the component pattern, dev workflow, and linting pages. |
| [Front-End — Component Pattern](frontend/component-pattern.md) | Component/Controller/Helper architecture, adding a new page or element, and routing utilities. |
| [Front-End — Dev Workflow](frontend/dev-workflow.md) | Running locally, building for production, tests/lint commands, Docker setup, and proxy modes. |
| [Front-End — Linting](frontend/linting.md) | ESLint rules and JSDoc conventions enforced on `frontend/assets/js/`. |
| [Front-End — Examples](frontend/examples.md) | Component/controller/helper code snippets referenced by the component pattern page. |
| [Contributing](contributing/index.md) | Language standard and documentation guidelines (the ~150-line-per-file target); links to git workflow and code style pages. |
| [Contributing — Git Workflow](contributing/git-workflow.md) | Commit guidelines, PR description template, definition of done, and CI checks a PR must pass locally. |
| [Contributing — Code Style](contributing/code-style.md) | Code organization (single responsibility, method order, one class per file, small methods), dependency injection, and refactoring guidelines. |
| [Contributing — Examples](contributing/examples.md) | Good/bad code snippets referenced by the git workflow and code style pages. |
| [Issue Enhancement](issue-enhancement.md) | Checklist of concerns to flesh out a vague issue idea before it reaches the `Created` stage. |
| [Azeroth Usage](external/azeroth-usage.md) | How to use the Azeroth gem's `resource_for`/`model_for` and decorators for Rails controller endpoints and JSON serialization. |
| [Sinclair Usage](external/sinclair-usage.md) | How to use the Sinclair gem's dynamic method builder, configuration objects, option objects, and plain Ruby models. |
| [Jace Usage](external/jace-usage.md) | How to use the Jace gem's event registry to build internal, event-driven logic within a single application. |
| [How to Use Navi](external/HOW_TO_USE_NAVI.md) | Integrating the Navi cache-warmer into CI/CD pipelines, across four integration modes (Docker image, npm package, CircleCI executor, hosted server). |
| [How to Use navi-hey-client](external/HOW_TO_USE_NAVI-CLIENT.md) | Using the `navi-hey-client` library/CLI to control an already-running, hosted Navi instance via its `/api/*` namespace. |
| [How to Use darthjee/tent](external/HOW_TO_USE_DARTHJEE-TENT.md) | Full reference for the darthjee/tent reverse proxy: Docker setup, rules/matchers/middlewares, cache configuration, and the frontend dev-mode flip. |
| [Plans](plans/) | Implementation plans for ongoing or upcoming features, one subfolder per issue. |
| [Issues](issues/) | Detailed specs for open issues. |
