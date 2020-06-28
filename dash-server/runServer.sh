#!/bin/bash

docker stop dash-server 2>&1 > /dev/null
docker rm   dash-server 2>&1 > /dev/null

docker run -dit \
    -p 8080:80 \
    -v /data/dash:/usr/local/apache2/htdocs/ \
    --name dash-server \
    vace117/dash-server
