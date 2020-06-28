# Make the Bucket
```text
gsutil mb gs://dash-video-storage
```
```

## Policies
```text
gsutil bucketpolicyonly set on gs://dash-video-storage
```
```text
gsutil iam ch allUsers:objectViewer gs://dash-video-storage
```

## CORS
```text
gsutil cors set <(echo '[{"origin":["*"]}]') gs://dash-video-storage/
```

## Access data
https://storage.googleapis.com/dash-video-storage/dylan/stream.mpd

# Upload data
```text
gsutil -m cp -r dylan/ gs://dash-video-storage/
```

## Set Content-Type
```text
gsutil -m setmeta -h "Content-Type:video/mp4" 'gs://dash-video-storage/**.mp4' 'gs://dash-video-storage/**.m4s'
gsutil -m setmeta -h "Content-Type:application/dash+xml" 'gs://dash-video-storage/**.mpd'
```

TODO: Do this during upload!


# PubSub Topic
```text
gcloud pubsub topics create dash-player-control
```

## SA
```text
gcloud iam service-accounts create dash-player
```

### Add Roles
```text
gcloud pubsub topics add-iam-policy-binding dash-player-control \
    --member=serviceAccount:dash-player@dash-281402.iam.gserviceaccount.com \
    --role=projects/dash-281402/roles/DASHPubSubClient
```


gcloud pubsub topics add-iam-policy-binding dash-player-control \
    --member=serviceAccount:dash-player@dash-281402.iam.gserviceaccount.com \
    --role=roles/pubsub.editor




gcloud pubsub topics add-iam-policy-binding dash-player-control \
    --member=serviceAccount:dash-player@dash-281402.iam.gserviceaccount.com \
    --role=roles/pubsub.editor

gcloud pubsub topics add-iam-policy-binding dash-player-control \
    --member=serviceAccount:dash-player@dash-281402.iam.gserviceaccount.com \
    --role=roles/pubsub.admin



## Set the security context to act as the SA (sudo SA)
```text
gcloud auth activate-service-account dash-player@dash-281402.iam.gserviceaccount.com --key-file=dash-281402-31e44711ba42.json
gcloud auth list
```

# Create Subscription
```text
gcloud pubsub subscriptions create client-1 \
    --topic dash-player-control \
    --ack-deadline 10 \
    --expiration-period 1d \
    --message-retention-duration 10m
```

* Look into cliboard manager

