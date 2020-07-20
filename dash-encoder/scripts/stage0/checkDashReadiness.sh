#!/bin/bash
  
CURRENT_DIR=`pwd`
cd "$(dirname "$0")"

FULL_PATH="$CURRENT_DIR/$1"
node checkDashReadiness.js "$FULL_PATH"