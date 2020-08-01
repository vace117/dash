There are 2 ways to server the files so far:

# Apache Docker image
## Build 
```text
docker build -t vace117/dash-server .
```

## Run
```text
./runServer.sh
```

# Google Bucket
## Make the Bucket
```text
gsutil mb gs://dash-video-storage
```

## Configure Policies
* Switch the bucket access control to bucket-wide policy. This disables ACLs on per-file basis:
```text
gsutil bucketpolicyonly set on gs://dash-video-storage
```
* Make the whole bucket available to the Internet:
```text
gsutil iam ch allUsers:objectViewer gs://dash-video-storage
```

## CORS
* Allow Cross Site References from anywhere:
```text
gsutil cors set <(echo '[{"origin":["*"]}]') gs://dash-video-storage/
```

## Set Content-Types
```text
gsutil -m setmeta -h "Content-Type:video/mp4" 'gs://dash-video-storage/**.mp4' 'gs://dash-video-storage/**.m4s'
gsutil -m setmeta -h "Content-Type:application/dash+xml" 'gs://dash-video-storage/**.mpd'
```

## Data Upload Example
```text
gsutil -m cp -r dylan/ gs://dash-video-storage/
```

## Data List Example
```text
$ gsutil ls 'gs://dash-video-storage/**.mpd'
gs://dash-video-storage/Dylan Werner/02 True Strength Fundamentals/Day 01 - Strength Practice 1/stream.mpd
gs://dash-video-storage/Dylan Werner/02 True Strength Fundamentals/Day 02 - Strength Practice 2/stream.mpd
gs://dash-video-storage/Dylan Werner/02 True Strength Fundamentals/Day 03 - Strength Practice 3/stream.mpd
gs://dash-video-storage/dylan/stream.mpd
```

## Delete Data Example
```text
gsutil -m rm -r 'gs://dash-video-storage/dylan'
```

## Move/Rename Data Example
```text
gsutil -m mv 'gs://dash-video-storage/Dylan Werner/' 'gs://dash-video-storage/Yoga/'
```

## Data Access Example
* Example of external URL used to access a bucket resource:
https://storage.googleapis.com/dash-video-storage/dylan/stream.mpd