# Deploy the committed config from CircleCI
In the `upload_proxy_files` job, replace the "Copy configuration files" step (`TARGET=configuration/ deploy_frontend.sh copy_files`) with two steps. They go after "Upload proxy files", so the Tent image's empty `configuration/.keep` is overwritten.

```yaml
      - run:
          name: Upload proxy configuration
          command: SOURCE=proxy/prod_configuration/ SSH_REMOTE_TEMP_DIR=$SSH_REMOTE_TEMP_DIR/configuration/ deploy_frontend.sh upload
      - run:
          name: Setup locals
          command: TARGET=configuration/locals.php SSH_REMOTE_TEMP_DIR=$SSH_REMOTE_TEMP_DIR/configuration deploy_frontend.sh copy_files
```

- The job's `working_directory` is `/home/app/app` and it runs `checkout`, so `proxy/prod_configuration/` is relative to the checkout. Confirm that `checkout` lands in `/home/app/app`, or use the right path.
- `rsync` creates the `configuration/` destination if it is missing, and the Tent upload already created it.
- `.htaccess` stays as it is today: it comes from the Tent image upload.
- `locals.php.sample` is uploaded too. That is harmless.

## Files to Change
- `.circleci/config.yml` — `upload_proxy_files`: upload the committed config, then carry forward only `configuration/locals.php`
