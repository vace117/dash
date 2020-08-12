#!/bin/bash

printf "Preparing production deploy..."
rm -rf dist dash
npm run build

GIT_BRANCH=`git rev-parse --abbrev-ref HEAD`
GIT_REV=`git rev-parse HEAD`
echo "${GIT_BRANCH}:${GIT_REV}" > dist/build.txt

cp -a dist dash

printf "\n\nDeploying to gatekeeper...\n"
rsync \
 --verbose \
 --archive \
 --recursive \
 --super \
 --whole-file \
dash \
root@gatekeeper:/usr/htdocs

sleep 2

printf "\n\nDone."
rm -rf dash