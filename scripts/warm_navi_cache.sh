#!/bin/bash

RESOURCE_FILES=(
  navi/resources/categories.yml
  navi/resources/kinds.yml
  navi/resources/user_navigation.yml
  navi/resources/clients.yml
)

function push_config() {
  FILE_ARGS=()
  for f in "${RESOURCE_FILES[@]}"; do
    FILE_ARGS+=(--file "$f")
  done

  OAK_NAVI_NAMESPACE="$OAK_NAVI_NAMESPACE_BASE" \
    navi-client -b "$NAVI_URL" -t "$NAVI_API_TOKEN" -a config "${FILE_ARGS[@]}"
}

function start_engine() {
  navi-client -b "$NAVI_URL" -t "$NAVI_API_TOKEN" -a engine-start \
    -p "{\"targets\":[{\"namespace\":\"${OAK_NAVI_NAMESPACE_BASE}\"}]}"
}

ACTION=$1

case $ACTION in
  "config")
    push_config
    ;;
  "engine-start")
    start_engine
    ;;
  *)
    $ACTION
    ;;
esac
