/* eslint-disable no-unused-vars */
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
require('log-timestamp')(() => {
    const messageTime = new Date()
    return `[${messageTime.toLocaleString('en-CA')} <${messageTime.getMilliseconds()}ms>]`
})
  

const PusherServer = new require('pusher')
const pusher = new PusherServer({
    appId: '1027455',
    key: 'db1489f973f891a9072e',
    secret: 'b340887912f16da9a0ca',
    cluster: 'us2',
    useTLS: true
})

const server = express()
server.use(bodyParser.json())
server.use(bodyParser.urlencoded({ extended: false }))
server.use(cors())


server.post('/pusher/auth', function(req, res) {
    console.log(req.body)

    const socketId = req.body.socket_id
    const channel = req.body.channel_name
    const password = req.body.password

    if ( password === 'GOODY') {
        const auth = pusher.authenticate(socketId, channel)
        res.send(auth)
    }
    else {
        res.sendStatus(403)
    }

})

// eslint-disable-next-line no-undef
var port = process.env.PORT || 5000
server.listen(port)

console.log('Listening for authentication requests...')