#!/bin/bash

LOCAL_DIR=$1
TARGET_BUCKET_PATH=$2

if [ -z "$LOCAL_DIR" ] ; then
    printf "\n   Please specify the directory containing the DASH presentation you wish to upload!\n\n"
    exit 1
fi

if [ -z "$TARGET_BUCKET_PATH" ] ; then
    printf "\n   Please specify the target path in the Google bucket (just the path - no host)\n\n"

    printf "   Fetching a list of existing videos...\n\n"
    gsutil ls 'gs://dash-video-storage/**.mpd'
    printf "\n\n   Please specify the target path as 2nd parameter.\n\n"

    exit 2
fi

FULL_BUCKET_PATH="gs://dash-video-storage$TARGET_BUCKET_PATH"

upload () {
    printf "\n\n   Checking authentication...\n\n"
    gcloud auth list 2>&1 | grep -q "No credential"
    NOT_LOGGED_IN=$?

    echo $NOT_LOGGED_IN
    if [ $NOT_LOGGED_IN -eq 0 ]; then
        printf "\n\n   You need to login...\n\n"
        gcloud auth login
    else
        printf "\n\n   Good. You are already logged in.\n\n"
    fi

    printf "\n\n   Uploading...\n\n"
    eval $COMMAND

    printf "\n\n   Setting MIME types...\n\n"
    gsutil -m setmeta -h "Content-Type:video/mp4" "$FULL_BUCKET_PATH/**.mp4" "$FULL_BUCKET_PATH/**.m4s"
    gsutil -m setmeta -h "Content-Type:application/dash+xml" "$FULL_BUCKET_PATH/**.mpd"
}


COMMAND="gsutil -m cp -r '$LOCAL_DIR' '$FULL_BUCKET_PATH'"
printf "Does the following look right?\n\n   $COMMAND\n\n"

read -p "(y/n)? " answer
case $answer in
    [Yy]* ) upload ;;
    * )     echo "Aborting...";;
esac