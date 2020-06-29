// Set logging format
//
require('log-timestamp')(() => {
  const messageTime = new Date()
  return `[${messageTime.toLocaleString('en-CA')} <${messageTime.getMilliseconds()}ms>]`
})

const { PubSub } = require('@google-cloud/pubsub')

const pubSubClient = new PubSub({
  projectId: 'dash-281402',
  keyFilename: 'src/keys/dash-281402-fabcde7c635b.json'
})

const TOPIC_NAME = 'dash-player-control'

async function testPubSub () {
  const subscription = await createSubscriptionToTopic(TOPIC_NAME)

  console.log('Registering message handler...')
  subscription.on('message', message => {
    console.log(`Receieved message: ${message.data}`)

    message.ack()
    subscription.close().then(() => deleteSubscription(subscription))
  })

  console.log(`Publishing test message to ${subscription.name}...`)
  await pubSubClient.topic(TOPIC_NAME).publishJSON({
    command: 'PLAY',
    time: 'time index goes here'
  })
}

async function deleteSubscription (subscription) {
  console.log(`Deleting ${subscription.name}...`)
  await subscription.delete()
}

async function createSubscriptionToTopic (topicName) {
  const subName = _generateRandomSubName()

  console.log(`Creating subscription to ${topicName}...`)
  const newSubscription = await pubSubClient
    .topic(topicName)
    .createSubscription(subName, {
      messageRetentionDuration: {
        seconds: 10 * 60 // 10 min
      },
      expirationPolicy: {
        ttl: {
          seconds: 24 * 60 * 60 // 24 hours
        }
      },
      ackDeadlineSeconds: 10 // seconds
    })
  console.log(`Subscription ${subName} created.`)

  return newSubscription[0]
}

function _generateRandomSubName () {
  const subName = `client-${require('crypto').randomBytes(4).toString('hex')}`

  console.log(`Generating unique subscription name: ${subName}`)
  return subName
}

testPubSub()
