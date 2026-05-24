# CI Plan

Step 6 of [plan.md](plan.md). Add CircleCI jobs for front-end linting and testing.

Reference: `../weave/.circleci/config.yml`.

---

## New Job: `jasmine`

Runs Jasmine unit tests for the front-end. The `Set folder` step flattens `frontend/` to the repo root so `package.json` is at `./`, matching the weave pattern.

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

---

## New Job: `frontend-checks`

Runs ESLint on the front-end source.

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

---

## Workflow Changes

Add both jobs to the `test` workflow and update `build-and-release` (and `upload_proxy_files`) to require them:

```yaml
workflows:
  version: 2
  test:
    jobs:
      - test:
          filters:
            tags:
              only: /.*/
      - checks:
          filters:
            tags:
              only: /.*/
      - jasmine:                        # new
          filters:
            tags:
              only: /.*/
      - frontend-checks:                # new
          filters:
            tags:
              only: /.*/
      - build-and-release:
          requires: [test, checks, jasmine, frontend-checks]   # updated
          filters:
            tags:
              only: /\d+\.\d+\.\d+/
            branches:
              ignore: /.*/
      - upload_proxy_files:
          requires: [test, checks, jasmine, frontend-checks]   # updated
          filters:
            tags:
              only: /\d+\.\d+\.\d+/
            branches:
              ignore: /.*/
      - release:
          requires: [build-and-release, upload_proxy_files]
          filters:
            tags:
              only: /\d+\.\d+\.\d+/
            branches:
              ignore: /.*/
      - warm-up-cache:
          requires: [release]
          filters:
            tags:
              only: /\d+\.\d+\.\d+/
            branches:
              ignore: /.*/
```

---

## Notes

- `darthjee/circleci_node:0.2.1` is the same image used by weave's front-end jobs — verify it is available on Docker Hub before merging.
- The `Set folder` command uses `cp frontend/.??* ./` to also copy dotfiles (e.g., `.eslintignore`, `eslint.config.mjs`) — this is intentional and mirrors weave exactly.
- `upload_fe_files` (the job that builds and uploads Vite assets to production) is defined in the parent issue #92's CI plan and is not added here.
