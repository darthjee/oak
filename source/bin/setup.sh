#!/usr/bin/bash

yarn install
bin/wait_for_db.sh
rake db:create db:migrate db:seed