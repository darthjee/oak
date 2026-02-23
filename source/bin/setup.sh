#!/usr/bin/bash

yarn install
rake db:create db:migrate db:seed