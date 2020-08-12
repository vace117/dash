This server's job is to authenticate the `dash-player` application.

# Endpoints
We expose 2 service endpoints:

## /authApp
This endpoint authenticates the `dash-player` application for user login purposes. It simply checks the password and answers yes or no for login

## /authPusher
This endpoint also checks the password, but on success it also authenticates the caller with the Pusher service, thus allowing the caller to send Pub/Sub messages to the channel. 

# Execution
## Development
```text
$ node index.js
```

## Production
There are 2 options available:

### 1) Google Cloud Functions
```text
$ ./deployGoogleFunctions.sh
```

This will create 2 functions:
 * `https://us-central1-dash-281402.cloudfunctions.net/authApp`
 * `https://us-central1-dash-281402.cloudfunctions.net/authPusher`

### 2) Self-Hosted
```text
$ ./runAuthServer.sh
```

You can change the port by modifying the variable inside `runAuthServer.sh`

