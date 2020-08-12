#!/bin/bash

if [ -z "$1" ] ; then
    printf "\n   Please specify the directory where your input videos are!\n\n"
    exit 1
fi

VIDEO_DIR=`readlink -f "$1"`

if [ ! -d "$VIDEO_DIR" ] ; then 
    printf "\n   '$VIDEO_DIR' does not exist!\n\n"
    exit 2
fi

docker stop dash-encoder &> /dev/null
docker rm   dash-encoder &> /dev/null


# Use the volume mount below for development:
#     -v /home/val/dash/dash-encoder/scripts:/home/dash/custom_scripts \
docker run -it \
    -v $VIDEO_DIR:/mnt/video \
    --name dash-encoder \
    vace117/dash-encoder
