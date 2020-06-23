#!/bin/bash

docker stop dash-encoder 2>&1 > /dev/null
docker rm   dash-encoder 2>&1 > /dev/null

docker run -it \
    -v /mnt/hde/work/dash:/mnt/video \
    --name dash-encoder \
    vace117/dash-encoder
