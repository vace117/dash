#!/bin/bash

docker stop dash-encoder 2>&1 > /dev/null
docker rm   dash-encoder 2>&1 > /dev/null

docker run -it \
    -v /home/val/dash/dash-encoder/VIDEO:/mnt/video \
    -v /home/val/dash/dash-encoder/scripts:/home/dash/custom_scripts \
    --name dash-encoder \
    vace117/dash-encoder
