# Make the Bucket
```text
gsutil mb gs://dash-video-storage
```

## Policies
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

## Data Access Example
* Example of external URL used to access a bucket resource:
https://storage.googleapis.com/dash-video-storage/dylan/stream.mpd


# PubSub Topic
```text
gcloud pubsub topics create dash-player-control
```

## Create Service Account (SA)
```text
gcloud iam service-accounts create dash-player
```

## Create a Custom Role
Create a custom role called `DASHPubSubClient` using the GCP Console. Include the following permissions:
  * pubsub.subscriptions.consume
  * pubsub.subscriptions.create
  * pubsub.subscriptions.get
  * pubsub.subscriptions.list
  * pubsub.topics.attachSubscription
  * pubsub.topics.get
  * pubsub.topics.list
  * pubsub.topics.publish

## Authorize SA to Create Subscriptions
* Bind this role to `dash-player` SA on the <ins>**Project**</ins>:
```bash
gcloud projects add-iam-policy-binding dash-281402 \
    --member=serviceAccount:dash-player@dash-281402.iam.gserviceaccount.com \
    --role=projects/dash-281402/roles/DASHPubSubClient
```

* Bind the same role to `dash-player` SA, but now on the <ins>**Topic**</ins>:
```bash
gcloud pubsub topics add-iam-policy-binding dash-player-control \
    --member=serviceAccount:dash-player@dash-281402.iam.gserviceaccount.com \
    --role=projects/dash-281402/roles/DASHPubSubClient
```

## Create SA Key
The key will be used by DASH clients to connect to the Topic using the SA we created.

GCP Console: `IAM & Admin -> Service Accounts -> dash-player -> ADD KEY -> JSON -> Save the file locally`

## Test Subscription Creation from the SA
* Set the current security context to act as the SA (bascially `'sudo SA'`)
```text
$ gcloud auth activate-service-account dash-player@dash-281402.iam.gserviceaccount.com --key-file=dash-281402-31e44711ba42.json
Activated service account credentials for: [dash-player@dash-281402.iam.gserviceaccount.com]

$ gcloud auth list
                 Credentialed Accounts
ACTIVE  ACCOUNT
*       dash-player@dash-281402.iam.gserviceaccount.com
        vace117@gmail.com
```

* Create Subscription:
```bash
gcloud pubsub subscriptions create client-1 \
    --topic dash-player-control \
    --ack-deadline 10 \
    --expiration-period 1d \
    --message-retention-duration 10m
```

* Delete Test Subscription
```bash
gcloud pubsub subscriptions delete projects/dash-281402/subscriptions/client-1
```

* If the previous commands ran successfully, you are now ready to use `@google-cloud/pubsub` NodeJS library