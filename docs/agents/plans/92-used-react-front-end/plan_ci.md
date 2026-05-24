# CI Plan: Frontend Jobs

Step 7 of [plan.md](plan.md). Add CircleCI jobs for linting, testing, and deploying the React frontend.

Reference: `../weave/.circleci/config.yml`.

---

## Context

The existing oak CI (`/.circleci/config.yml`) already has a `release` job that uses `darthjee/vite_weave-base:0.0.4`. Once `darthjee/vite_oak-base` is published, update that reference. The new jobs below follow the weave pattern exactly.

---

## New Jobs

### `jasmine`

Runs Jasmine unit tests for the frontend.

```yaml
jasmine:
  docker:
    - image: darthjee/circleci_node:0.2.1
  steps:
    - checkout
    - run:
        name: Set folder
        command: rm source -rf; cp frontend/* frontend/.??* ./ -r; rm frontend -rf
    - run:
        name: Yarn install
        command: yarn install
    - run:
        name: Tests
        command: npm test
```

### `frontend-checks`

Runs ESLint on the frontend source.

```yaml
frontend-checks:
  docker:
    - image: darthjee/circleci_node:0.2.1
  steps:
    - checkout
    - run:
        name: Set folder
        command: rm source -rf; cp frontend/* frontend/.??* ./ -r; rm frontend -rf
    - run:
        name: Yarn install
        command: yarn install
    - run:
        name: Check JS Lint
        command: npm run lint
```

### `upload_fe_files`

Builds the Vite assets and uploads them to the production server.

```yaml
upload_fe_files:
  docker:
    - image: darthjee/vite_oak-base:0.0.1
  steps:
    - checkout
    - run:
        name: Set folder
        command: rm source -rf; cp frontend/* frontend/.??* ./ -r; rm frontend -rf
    - run:
        name: Yarn install
        command: yarn install
    - run:
        name: Build assets
        command: deploy_frontend.sh build
    - run:
        name: Generate key file
        command: deploy_frontend.sh generate_key_file
    - run:
        name: Generate folder
        command: SSH_REMOTE_TEMP_DIR=$SSH_REMOTE_TEMP_DIR/static/ deploy_frontend.sh generate_folder
    - run:
        name: Upload assets
        command: SOURCE=dist/ SSH_REMOTE_TEMP_DIR=$SSH_REMOTE_TEMP_DIR/static/ deploy_frontend.sh upload
```

---

## Workflow Changes

Update the `test` workflow to include the new jobs and gate `build-and-release` on them:

```yaml
workflows:
  version: 2
  test:
    jobs:
      - test: ...
      - checks: ...
      - jasmine: ...           # new
      - frontend-checks: ...   # new
      - build-and-release:
          requires: [test, checks, jasmine, frontend-checks]
          ...
      - upload_proxy_files:
          requires: [test, checks, jasmine, frontend-checks]
          ...
      - upload_fe_files:       # new
          requires: [test, checks, jasmine, frontend-checks]
          ...
      - release:
          requires: [build-and-release, upload_proxy_files, upload_fe_files]
          ...
```

---

## Notes

- The `darthjee/circleci_node` image must be available on Docker Hub. If it isn't yet, use the same node image used by weave.
- The `Set folder` step mirrors the weave pattern: removes irrelevant folders and flattens `frontend/` to the root so that `package.json` is at `./`.
- Once `darthjee/vite_oak-base` is published, update both `upload_fe_files` and the existing `release` job to use it.
