#!/bin/bash

printf "Preparing production deploy..."
rm -rf dist dash
npm run build

printf "\n\nDeploying to 'gs://fungate'...\n"
gsutil rm -r 'gs://fungate/*'
gsutil -m -h "Cache-Control:no-cache,max-age=0" cp -r dist/*  gs://fungate