/** ***********************************************************************
 * dash-auth-server needs to be running to use this test!
 *
 * This verifies that our clients can publish messages to the private channel
 *
 * *************************************************************************/

// Set logging format
//
require('log-timestamp')(() => {
  const messageTime = new Date()
  return `[${messageTime.toLocaleString('en-CA')} <${messageTime.getMilliseconds()}ms>]`
})
const chalk = require('chalk')
const PusherClient = require('pusher-js')
// PusherClient.logToConsole = true
const sendClient = _createClient()
const receiveClient = _createClient()

const CHANNEL_NAME = 'private-player-control'
const SUCCESSFUL_TEST = 'SUCCESSFUL_TEST'

async function testPubSub () {
  _setupReceiveClient()
}

testPubSub()

function _setupReceiveClient () {
  console.log('Subscribing the receiving client...')

  receiveClient
    .subscribe(CHANNEL_NAME)
    .bind('pusher:subscription_succeeded', function () {
      _sendTestCommand()

      console.log('Receiver waiting for test message...')
    })
    .bind('client-test-command', function (data) {
      console.log(`Received test data: ${JSON.stringify(data)}`)
      if (data.payload === SUCCESSFUL_TEST) {
        console.log(chalk.greenBright('TEST SUCCESS!!!'))
        sendClient.disconnect()
        receiveClient.disconnect()
      } else {
        console.log(chalk.redBright('You suck!! Test failure.'))
      }
    })
}

function _sendTestCommand () {
  console.log('Subscribing the sending client...')
  const channel = sendClient.subscribe(CHANNEL_NAME)

  channel.bind('pusher:subscription_succeeded', function () {
    console.log('Missiles away...')
    channel.trigger('client-test-command', { payload: SUCCESSFUL_TEST })
  })
}

function _createClient () {
  return new PusherClient('e5177df52242aa7b7378', {
    cluster: 'us2',
    authEndpoint: 'http://localhost:5000/pusher/auth',
    auth: {
      params: { password: _readPassword() }
    }
  })
}

function _readPassword () {
  if (process.env.DASH_AUTH_PASSWORD) {
    return process.env.DASH_AUTH_PASSWORD
  } else throw new Error('DASH_AUTH_PASSWORD environment variable is not set!')
}
