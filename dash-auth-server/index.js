/* eslint-disable no-unused-vars */
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
require('log-timestamp')(() => {
    const messageTime = new Date()
    return `[${messageTime.toLocaleString('en-CA')} <${messageTime.getMilliseconds()}ms>]`
})

const fs = require('fs')
const SECRETS = JSON.parse( fs.readFileSync('secrets-1027455.json') )

const PusherServer = new require('pusher')
const pusher = new PusherServer({
    appId: '1027455',
    key: 'e5177df52242aa7b7378',
    secret: SECRETS['pusher-dash-secret'],
    cluster: 'us2',
    useTLS: true
})

const server = express()
server.use(bodyParser.json())
server.use(bodyParser.urlencoded({ extended: false }))
server.use(cors())

server.post('/dash-app/auth', function(req, res) {
    console.log(`Received authentication request from '${req.headers['origin']}' using '${req.headers['user-agent']}'`)

    if ( _checkPassword (req.body.password) ) {
        console.log('Successfully authenticated application client.')
        res.send({status: 'ok'})
    }
    else {
        console.error(`Incorrect password provided: '${req.body.password}'!`)
        res.sendStatus(403)
    }

})

server.post('/pusher/auth', function(req, res) {
    console.log(`Received authentication request from '${req.headers['origin']}' using '${req.headers['user-agent']}'`)

    const socketId = req.body.socket_id
    const channel = req.body.channel_name
    const password = req.body.password

    if ( _checkPassword (password) ) {
        const auth = pusher.authenticate(socketId, channel)
        console.log(`Successfully authenticated socket '${socketId}' for channel '${channel}'`)
        res.send(auth)
    }
    else {
        console.error(`Incorrect password provided: '${password}'!`)
        res.sendStatus(403)
    }

})

function _checkPassword (password) {
    return password === SECRETS['dash-auth-server-password']
}


var port = process.env.PORT || 5000
server.listen(port)

console.log('Listening for authentication requests...')