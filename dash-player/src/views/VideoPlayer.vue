<template>
  <div id="videoPlayerPanel">
    <div v-show="!pubSubInitCompletedInd">
      <b-spinner type="grow" variant="warning" style="width: 10em; height: 10em;" />
      <p/>
      <span style="font-size: large">Please wait...</span>
      <p/>
      <b-button v-if="errorsPresent" @click="goBackToLogin" size="lg" variant="warning" style="margin-left: 20px">LOGIN AGAIN</b-button>
    </div>
    <div v-show="pubSubInitCompletedInd">
      <video id="videoPlayer" controls></video>
      <p/>
      <b-button @click="goBack" size="lg" variant="warning">GO BACK</b-button>
    </div>

  </div>
</template>

<script>
import { mapFields } from 'vuex-map-fields'

import createOrSubscribeToChannelForVideo from '@/pubsub/pusher.js'

const _ = require('lodash/core')

export default {
  data () {
    return {
      pubSubInitCompletedInd: false
    }
  },

  mounted () {
    this.$store.commit('clearErrors')
    this.lastCommandReceived = null
    this.lastBroadcast = null

    this._initDashPlayer()

    createOrSubscribeToChannelForVideo({
      selectedVideoURL: this.$store.state.selectedVideoUrl,
      password:         this.$store.state.password
    })
      .then(channel => {
        this.pubSubChannel = channel
        this.pubSubChannel.bind('client-video-command', this.processReceivedCommand)
        this.pubSubInitCompletedInd = true
      })
      .catch(error => this.$store.commit('updateErrors', error))
  },

  methods: {
    goBack () {
      this._tearDown()
      this.$router.push({ path: '/selectVideo' })
    },

    goBackToLogin () {
      this.$router.push({ path: '/' })
    },

    _tearDown () {
      this.pubSubChannel.pusher.disconnect()
      this.pubSubChannel = null

      this.dashPlayer.reset()
      this.dashPlayer = null
    },

    _initDashPlayer () {
      const dashjs = require('dashjs')

      this.dashPlayer = dashjs.MediaPlayer().create()
      this.dashPlayer.initialize(
        document.querySelector('#videoPlayer'),
        this.$store.state.selectedVideoUrl,
        false
      )
      this.dashPlayer.on('playbackPlaying', this.broadcastPlayerEvent)
      this.dashPlayer.on('playbackPaused',  this.broadcastPlayerEvent)
    },

    processReceivedCommand (command) {
      if (!_.isEqual(command, this.lastCommandReceived)) {
        this._withBroadcastLock(() => {
          console.log(`Received command: ${JSON.stringify(command)}`)
          this.lastCommandReceived = command

          if (command.type === 'playbackPlaying') {
            this.dashPlayer.seek(command.playingTime)
            this.dashPlayer.play()
          }
          else if (command.type === 'playbackPaused') {
            this.dashPlayer.pause()
          }
          else {
            console.error('Don\'t know how to process this command!')
          }
        })
      }
    },

    _withBroadcastLock (code) {
      // Prevent broadcast of DASH events that are a direct result of the command
      // we just received. This avoids infinite pub/sub message loops.
      //
      this.eventBroadcastLockedInd = true

      // Execute the code that is going to generate DASH events that we want blocked
      //
      code.apply(this)

      // Unlock DASH event broadcast after a timeout. This timeout must be
      // big enough for all DASH events that resulted from the commands above
      // to fire and be blocked from being sent to the pub/sub channel
      //
      setTimeout(() => {
        this.eventBroadcastLockedInd = false
      }, 3000)
    },

    broadcastPlayerEvent (payload) {
      if (!this.eventBroadcastLockedInd && !_.isEqual(payload, this.lastBroadcast)) {
        console.log('Broadcasting Video Event: ' + JSON.stringify(payload))
        this.lastBroadcast = payload
        this.pubSubChannel.trigger('client-video-command', payload)
      }
      else {
        // console.log(`Broadcast of ${JSON.stringify(payload)} was blocked.`)
      }
    }

  },

  computed: {
    ...mapFields(['selectedVideoUrl']),

    errorsPresent () {
      return this.$store.getters.errorsPresent
    }
  }

}
</script>

<style scoped>
  video {
      width: 70%;
      background-color: #666666;
  }
</style>
