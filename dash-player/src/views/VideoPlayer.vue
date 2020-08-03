<template>
  <b-row align-h="center" class="text-center">
    <b-col id="videoPlayerPanel">
      <div v-show="!pubSubInitCompletedInd">
        <b-spinner type="grow" variant="warning" style="width: 10em; height: 10em;" />
        <p/>
        <span style="font-size: large">Please wait...</span>
        <p/>
        <b-button v-if="errorsPresent" @click="goBackToLogin" size="lg" variant="warning" style="margin-left: 20px">LOGIN AGAIN</b-button>
      </div>
      <div v-show="pubSubInitCompletedInd">

        <b-row no-gutters>
          <b-col cols="10" class="p-3">
            <!-- Video Player -->
            <video id="videoPlayer" controls></video>
          </b-col>
          <b-col class="screenSectionBorder">
            <b-row>
              <b-col>
                <span class="smallerScreenText nowrap">Team Roster</span>
                <hr class="mediumHR"/>
              </b-col>
            </b-row>
            <b-row>
              <b-col class="text-left pl-1 otherColor smallestScreenText">
                <ul class="noBullets">
                  <li style="font-size: 1.3em">{{userName}}</li>
                  <li v-for="remoteUser in crewRoster" :key="remoteUser">
                    {{remoteUser}}
                  </li>
                </ul>
              </b-col>
            </b-row>
          </b-col>
        </b-row>
        <b-row no-gutters class="mt-3">
          <b-col>
            <!-- Current Link -->
            <hr class="mediumHR"/>
            <div class="smallestScreenText text-center">{{selectedVideoUrl}}</div>
            <p/>
            <b-button @click="goBack" size="lg" variant="secondary">GO BACK</b-button>
          </b-col>
        </b-row>
      </div>
    </b-col>
  </b-row>
</template>

<script>
import { mapFields } from 'vuex-map-fields'

import createOrSubscribeToChannelForVideo from '@/pubsub/pusher.js'

const _ = require('lodash/core')

const KEEP_ALIVE_PERIOD_SECONDS = 15
const NodeCache = require('node-cache')
const liveUserCache = new NodeCache({
  stdTTL:      KEEP_ALIVE_PERIOD_SECONDS + 5,
  checkperiod: KEEP_ALIVE_PERIOD_SECONDS / 3
})

export default {
  data () {
    return {
      pubSubInitCompletedInd: false,
      crewRoster: []
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
        // Register Pub/Sub message processors
        //
        this.pubSubChannel = channel
        this.pubSubChannel.bind('client-video-command',  this.processReceivedCommand)
        this.pubSubChannel.bind('client-user-keepalive', this.processUserKeepAlive)
        this.pubSubInitCompletedInd = true

        // Register Live User cache callbacks and begin sending out KeepAlive messages
        //
        liveUserCache.on('set',     this.updateCrewRoster)
        liveUserCache.on('expired', this.updateCrewRoster)
        liveUserCache.on('flush',   this.updateCrewRoster)
        liveUserCache.flushAll()
        this.sendAliveMessage()
        this.keepAliveTimer = setInterval(
          () => this.sendAliveMessage(),
          KEEP_ALIVE_PERIOD_SECONDS * 1000
        )
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
      clearInterval(this.keepAliveTimer)

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

    updateCrewRoster () {
      this.crewRoster = liveUserCache.keys()
    },

    sendAliveMessage () {
      console.log('Broadcasting our KeepAlive...')
      this.pubSubChannel.trigger('client-user-keepalive', this.$store.state.userName)
    },

    processUserKeepAlive (remoteUserName) {
      if (remoteUserName !== this.$store.state.userName) {
        console.log(`Received KeepAlive for ${remoteUserName}`)
        liveUserCache.set(remoteUserName, null)
      }
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
        // Generate unique token and include in message for de-duplication
      }
      else {
        // console.log(`Broadcast of ${JSON.stringify(payload)} was blocked.`)
      }
    }

  },

  computed: {
    ...mapFields(['userName', 'selectedVideoUrl']),

    errorsPresent () {
      return this.$store.getters.errorsPresent
    }
  }

}
</script>

<style scoped>
  video {
      width: 80%;
      background-color: #666666;
  }

  .noBullets {
    list-style-type: none;
  }
</style>
