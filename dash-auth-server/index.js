/**
 * This file can be used for local testing by running it directly:
 *    
 *     $ node index.js
 * 
 * Production deploy is accomplished by running 'deployGoogleFunctions.sh'
 */
require('log-timestamp')(() => {
    const messageTime = new Date()
    return `[${messageTime.toLocaleString('en-CA')} <${messageTime.getMilliseconds()}ms>]`
})

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const ServerFunctions = require('./server-functions')

const server = express()
server.use(bodyParser.json())
server.use(bodyParser.urlencoded({ extended: false }))
server.use(cors())


server.post('/authApp',    ServerFunctions.appAuthentication)
server.post('/authPusher', ServerFunctions.pusherAuthentication)


var port = process.env.PORT || 5000
server.listen(port)

console.log('Listening for authentication requests...')