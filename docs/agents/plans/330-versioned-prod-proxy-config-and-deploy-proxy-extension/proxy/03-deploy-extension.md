# Deploy proxy/extension/ in upload_proxy_files
Add one step to `upload_proxy_files`, after "Upload proxy files" (the Tent upload, which ships an empty `extension/loader.php`), so the real `loader.php` and handler classes overwrite it:

```yaml
      - run:
          name: Upload proxy extension
          command: SOURCE=proxy/extension/ SSH_REMOTE_TEMP_DIR=$SSH_REMOTE_TEMP_DIR/extension/ deploy_frontend.sh upload
```

Place it after the Tent upload (e.g. after "Setup locals"). No workflow or `release` changes: `release` already requires `upload_proxy_files`.

## Files to Change
- `.circleci/config.yml` — new "Upload proxy extension" step in `upload_proxy_files`
