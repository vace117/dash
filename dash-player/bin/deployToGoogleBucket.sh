#!/bin/bash

printf "Preparing production deploy..."
rm -rf dist
npm run build

GIT_BRANCH=`git rev-parse --abbrev-ref HEAD`
GIT_REV=`git rev-parse HEAD`
echo "${GIT_BRANCH}:${GIT_REV}" > dist/build.txt

printf "\n\nDeploying to 'gs://fungate'...\n"
gsutil -m rm -r 'gs://fungate/*'
gsutil -m -h "Cache-Control:no-cache,max-age=0" cp -r dist/*  'gs://fungate'