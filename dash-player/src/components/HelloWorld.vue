<template>
  <div class="hello">
    <!-- <h1>{{ msg }}</h1> -->

    <h1>
      KEY: {{subscription}}
    </h1>

    <button v-on:click="runStuff">Read The Key</button>
  </div>
</template>

<script>

// const TOPIC_NAME = 'dash-player-control'
const Crypto = require('crypto')

export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  data: function () {
    return {
      pubSubClient: null,
      subscription: null
    }
  },
  methods: {
    runStuff: async function (event) {
      // const { PubSub } =
      require('@google-cloud/pubsub')

      // this.pubSubClient = new PubSub({
      //   projectId: 'dash-281402',
      //   keyFilename: 'keys/dash-281402-fabcde7c635b.json'
      // })
      // this.subscription = await this._createSubscriptionToTopic(TOPIC_NAME)
    },

    _createSubscriptionToTopic: async function (topicName) {
      const subName = this._generateRandomSubName()

      console.log(`Creating subscription to ${topicName}...`)
      const newSubscription = await this.pubSubClient
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
    },

    _generateRandomSubName: function () {
      const subName = `client-${Crypto.randomBytes(4).toString('hex')}`

      console.log(`Generating unique subscription name: ${subName}`)
      return subName
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
