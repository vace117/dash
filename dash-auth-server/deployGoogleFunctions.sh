#!/bin/bash

printf "\n   Deploying 'authApp' function...\n\n"
gcloud functions deploy authApp --entry-point appAuthentication --runtime nodejs10 --trigger-http --allow-unauthenticated

printf "\n   Deploying 'authPusher' function...\n\n"
gcloud functions deploy authPusher --entry-point pusherAuthentication --runtime nodejs10 --trigger-http --allow-unauthenticated
