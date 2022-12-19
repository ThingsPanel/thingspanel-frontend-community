#!/usr/bin/env bash

if [ "$ENV_MODE" = "development" ];then
    npm install
    npm run serve
fi
