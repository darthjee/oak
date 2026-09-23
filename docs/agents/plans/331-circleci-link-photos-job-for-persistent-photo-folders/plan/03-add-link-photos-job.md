# Add the link_photos job and wire it into release

Add a job next to `upload_proxy_files`, modelled on Majora's `link_photos`
but linking `photos` and `snaps` separately. `origin/` is never served, so it
is not linked.

```yaml
  link_photos:
    docker:
      - image: darthjee/tent:0.10.4
    working_directory: /home/app/app
    steps:
      - checkout
      - run:
          name: Generate key file
          command: bin/deploy_frontend.sh generate_key_file
      - run:
          name: Generate folder
          command: bin/deploy_frontend.sh generate_folder
      - run:
          name: Link photos
          command: SOURCE=$REMOTE_HOME/photos/photos DEPLOY_PATH=photos bin/deploy_frontend.sh link
      - run:
          name: Link snaps
          command: SOURCE=$REMOTE_HOME/photos/snaps DEPLOY_PATH=snaps bin/deploy_frontend.sh link
```

`generate_folder` runs `mkdir -p` on the temp release dir, so the job does
not depend on any upload job and can run in parallel with them.

In the workflow:

```yaml
      - link_photos:
          requires: [test, checks, jasmine, frontend-checks]
          filters:
            tags:
              only: /\d+\.\d+\.\d+/
            branches:
              ignore: /.*/
      - release:
          requires:
            - build-and-release
            - upload_proxy_files
            - upload_fe_files
            - link_photos
            # image releases unchanged
```

## Files to Change
- `.circleci/config.yml` — new `link_photos` job and workflow entry; add
  `link_photos` to `release.requires`
