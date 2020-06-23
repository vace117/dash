#!/bin/bash

SCRIPT_DIR=$(dirname "$0")
echo $SCRIPT_DIR

npm --prefix $SCRIPT_DIR start $@