## Context

While refining #217 ("Add docker image build to CI pipeline"), the chosen approach ports majora's and the
`docker` repo's hand-rolled `bin/image.sh` script + parameterized `release-image` CircleCI job — deliberately
kept consistent with those two sibling projects rather than adopting CircleCI's official `circleci/docker` orb,
which could reduce the amount of custom bash/YAML oak has to maintain going forward. That trade-off was
explicitly deferred out of #217's scope into this follow-up, so the orb option gets a real investigation
instead of a snap decision made mid-refinement.

## What needs to be done

Investigate whether CircleCI's official `circleci/docker` orb (or another maintained orb) would meaningfully
simplify oak's — and by extension majora's and the `docker` repo's — image build/publish pipeline. At minimum
cover:

- Build + push + Docker Hub login
- Multi-arch (QEMU/buildx) support
- Equivalents of `bin/image.sh`'s `skip_if_not_tag`/`skip_if_unchanged` guards (version-file-driven, diff-scoped
  skip logic that avoids re-publishing unchanged images or authenticating on branch builds)

Weigh orb adoption against staying with the hand-rolled script that's already proven and shared across three
repos (`oak`, `majora`, `docker`). Produce a clear recommendation, not just a feature comparison.

Related: a sibling follow-up in `darthjee/docker` is investigating replacing `bin/image.sh`'s QEMU + per-arch
`docker build` pattern with `docker buildx build --platform ... --push` — that issue also touches the orb
question from the angle of "since we're rewriting the script anyway, is this also the moment to drop it for an
orb?". Worth reading together with whatever that issue lands on.

## Acceptance criteria

- [ ] Orb capabilities mapped against `bin/image.sh`'s current feature set (build, push, `skip_if_not_tag`,
      `skip_if_unchanged`, QEMU/multi-arch)
- [ ] Explicit decision recorded: adopt orb, or keep `bin/image.sh` — with rationale
- [ ] If adopting: migration plan covering oak, majora, and the `docker` repo (or explicitly scoped to just one
      first)
