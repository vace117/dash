#!/bin/bash

docker stop dash-server 2&>1
docker rm   dash-server 2&>1

docker run -dit \
    -p 8080:80 \
    -v /mnt/hde/work/dash/output:/usr/local/apache2/htdocs/ \
    --name dash-server \
    vace117/dash-server