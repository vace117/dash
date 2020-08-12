/**
 * The functions in this file are executed directly as Google Cloud Functions
 * 
 * See 'deployGoogleFunctions.sh' for details on the mapping
 */

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


exports.appAuthentication = function(req, res) {
    _withCORSHandling(req, res, () => {
        console.log(`Received authentication request from '${req.headers['user-agent']}'`)

        if ( _checkPassword (req.body.password) ) {
            console.log('Successfully authenticated application client.')
            res.send({status: 'ok'})
        }
        else {
            console.error(`Incorrect password provided: '${req.body.password}'!`)
            res.sendStatus(403)
        }
    })
}

exports.pusherAuthentication = function(req, res) {
    _withCORSHandling(req, res, () => {
        console.log(`Received authentication request from '${req.headers['user-agent']}'`)

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
}

// Set CORS headers for preflight requests
// Allows GETs from any origin with the Content-Type header
// and caches preflight response for 3600s
//
function _withCORSHandling (req, res, requestProcessor) {
    res.set('Access-Control-Allow-Origin', '*')

    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET')
        res.set('Access-Control-Allow-Headers', 'Content-Type')
        res.set('Access-Control-Max-Age', '3600')
        res.status(204).send('')
    } else {
        requestProcessor()
    }

}

function _checkPassword (password) {
    return password === SECRETS['dash-auth-server-password']
}