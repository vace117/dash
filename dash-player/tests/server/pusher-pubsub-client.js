// Set logging format
//

/* eslint-disable no-unused-vars */

const PusherClient = require('pusher-js')

require('log-timestamp')(() => {
  const messageTime = new Date()
  return `[${messageTime.toLocaleString('en-CA')} <${messageTime.getMilliseconds()}ms>]`
})

const CHANNEL_NAME = 'dash-player-control'

async function testPubSub () {
  console.log('Initializing pusher client...')
  PusherClient.logToConsole = true
  const pusher = new PusherClient('db1489f973f891a9072e', {
    cluster: 'us2',
    authEndpoint: 'http://localhost:5000/pusher/auth',
    auth: {
      params: { password: 'GOODY' }
    }
  })

  console.log('Subscribing...')
  const channel = pusher.subscribe('private-player-control')

  channel.bind('pusher:subscription_succeeded', function () {
    console.log('Subscribtio suceeded.')
  })

  channel.bind('PLAY', function (data) {
    console.log(JSON.stringify(data))
  })
}

testPubSub()
