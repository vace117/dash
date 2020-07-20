#!/bin/bash

CURRENT_DIR=`pwd`
cd "$(dirname "$0")"
node checkDashReadiness.js "$CURRENT_DIR/$1"
