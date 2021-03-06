import auth from '@/pubsub/authentication'

const Pusher = require('pusher-js')
const crypto = require('crypto')

// Pusher.logToConsole = true

export default function createOrSubscribeToChannelForVideo ({ selectedVideoURL, password }) {
  return new Promise((resolve, reject) => {
    if (selectedVideoURL) {
      const pusherClient = _createClient(password)

      const channelName = _createChannelName(selectedVideoURL)
      console.log(`Attempting to subscribe to ${channelName} channel...`)
      const channel = pusherClient.subscribe(channelName)

      channel
        .bind('pusher:subscription_succeeded', () => {
          console.log('Channel subscription successful!')

          resolve(channel)
        })
        .bind('pusher:subscription_error', status => {
          const errorText = `Subscription to ${channelName} failed with error code: ${status}`
          console.error(errorText)

          reject(new Error(errorText))
        })
    }
    else {
      reject(new Error('selectedVideoURL was empty!'))
    }
  })
}

function _createClient (clientPassword) {
//  return new Pusher('4f1ab39f3acaeb49a37c', {
  return new Pusher('e5177df52242aa7b7378', {
    cluster: 'us2',
    authEndpoint: auth.pusher_endpoint,
    auth: {
      params: { password: clientPassword }
    }
  })
}

function _createChannelName (selectedVideoURL) {
  const channelName = `private-${crypto.createHash('md5').update(selectedVideoURL).digest('hex')}`
  console.log(`Generated PubSub channel name: ${channelName}`)

  return channelName
}
