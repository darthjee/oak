#!/bin/bash

for _ in $(seq 1 30); do
  if ( echo "" | telnet "$OAK_MYSQL_HOST" "$OAK_MYSQL_PORT" | grep Escape ); then
    echo done;
    exit 0;
  fi
  sleep 1;
done

exit 1;
