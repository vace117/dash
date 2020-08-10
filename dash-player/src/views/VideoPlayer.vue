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
                  <li v-for="remoteUser in Object.keys(crewRoster)" :key="remoteUser">
                    {{remoteUser}}

                    <span v-if="crewRoster[remoteUser].audioEstablished" style="color: green">
                      (Audio Connected)
                    </span>

                    <div v-if="crewRoster[remoteUser].audioEstablished">
                      <audio :id="'remoteAudio_' + remoteUser" playsinline autoplay></audio>
                    </div>
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
            <b-button @click="goBackToLogin" size="lg" variant="secondary">GO BACK</b-button>
          </b-col>
        </b-row>
      </div>
    </b-col>
  </b-row>
</template>

<script>
import Vue from 'vue'
import { mapFields } from 'vuex-map-fields'

import createOrSubscribeToChannelForVideo from '@/pubsub/pusher.js'
import WebRTCPeerManager from '@/webrtc/microphone.js'

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
      crewRoster: {}
    }
  },

  mounted () {
    this.$store.commit('clearErrors')
    this.lastCommandReceived = null
    this.lastBroadcast = null
    this.audioPeers = {}

    // this._initDashPlayer()

    createOrSubscribeToChannelForVideo({
      selectedVideoURL: this.$store.state.selectedVideoUrl,
      password:         this.$store.state.password
    })
      .then(channel => {
        // Register Pub/Sub message processors
        //
        this.pubSubChannel = channel
        this.pubSubChannel.bind('client-video-command',    this.processReceivedVideoCommand)
        this.pubSubChannel.bind('client-user-keepalive',   this.processUserKeepAlive)
        this.pubSubChannel.bind('client-webrtc-signaling', this.processWebRTCSignaling)
        this.pubSubInitCompletedInd = true

        // Register Live User cache callbacks and begin sending out KeepAlive messages
        //
        liveUserCache.on('set',     this.addCrew)
        liveUserCache.on('expired', this.removeCrew)
        liveUserCache.on('flush',   this.removeCrew)
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
      this._tearDown()
      this.$router.push({ path: '/' })
    },

    _tearDown () {
      clearInterval(this.keepAliveTimer)

      if (this.pubSubChannel) {
        this.pubSubChannel.pusher.disconnect()
        this.pubSubChannel = null
      }

      if (this.dashPlayer) {
        this.dashPlayer.reset()
        this.dashPlayer = null
      }

      // Flushing all remote users from cache will result
      // in WebRTC cleanup for each user as well
      //
      liveUserCache.flushAll()
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

      const videoElement = document.getElementById('videoPlayer')
      videoElement.onkeydown = (e) => {
        console.log(`DOWN: ${e.code}`)
        this.dashPlayer.setVolume(0.1)
        return e
      }

      videoElement.onkeyup = (e) => {
        console.log(`UP: ${e.code}`)
        this.dashPlayer.setVolume(1.0)
        return e
      }
    },

    // Goes through the users currently held in the expiring cache and adds any users
    // that were not yet part of the Team Roster
    //
    addCrew () {
      for (const userName of liveUserCache.keys()) {
        if (!this.crewRoster[userName]) {
          this._addOrUpdateCrewMember(userName, { audioEstablished: false })
        }
      }
    },

    // Goes through the Team Roster and removes any users that are no longer
    // in the user cache
    //
    removeCrew () {
      Object
        .keys(this.crewRoster)
        .filter(user => !liveUserCache.get(user))
        .forEach(deadUser => this._cleanupAfterUser(deadUser))
    },

    _cleanupAfterUser (user) {
      // Disconnect and cleanup the WebRTC connection
      //
      this.audioPeers[user].disconnect()
      delete this.audioPeers[user]

      // Remove user from Team Roster on the screen
      //
      Vue.delete(this.crewRoster, user)
    },

    _addOrUpdateCrewMember (userName, metadata) {
      Vue.set(this.crewRoster, userName, metadata)
    },

    sendAliveMessage () {
      // console.log('Broadcasting our KeepAlive...')
      this.pubSubChannel.trigger('client-user-keepalive', this.$store.state.userName)
    },

    processUserKeepAlive (remoteUserName) {
      if (remoteUserName !== this.$store.state.userName) {
        // console.log(`Received KeepAlive for ${remoteUserName}`)
        liveUserCache.set(remoteUserName, null)

        // Check if we already have an audio connection to this user, and establish if not
        //
        if (!this.audioPeers[remoteUserName]) {
          this._createWebRTCPeerManagerFor(remoteUserName)
            .initiateConnectionToUser(remoteUserName)
            .then(() => this.transmitAudioTo(remoteUserName))
        }
      }
    },

    _createWebRTCPeerManagerFor (remoteUserName) {
      const audioPeer = new WebRTCPeerManager(
        this.pubSubChannel,
        this.$store.state.userName,
        remoteUserName,
        (disconnectedUser) => {
          this._cleanupAfterUser(disconnectedUser)
        }
      )

      this.audioPeers[remoteUserName] = audioPeer

      return audioPeer
    },

    processWebRTCSignaling (message) {
      if (message.toUser === this.$store.state.userName) {
        const remoteUserName = message.fromUser

        try {
          // If this is an offer for us, the WebRTCPeerManager might not exist yet - need to check
          //
          if (message.offer) {
            // If this offer comes from a peer that we have not found yet, we need to create
            // a new WebRTCPeerManager instance for it. However, we may have already sent
            // our own offer to this peer, in which case WebRTCPeerManager already exists
            //
            if (!this.audioPeers[remoteUserName]) {
              console.log(`Creating new WebRTCPeerManager, b/c received an offer from ${remoteUserName}`)

              this._createWebRTCPeerManagerFor(remoteUserName)
            }

            // Now we know that WebRTCPeerManager instance exists...
            //
            this.audioPeers[remoteUserName]
              .acceptConnectionFromUser(message.offer)
              .then(() => this.transmitAudioTo(remoteUserName))
          }
          else {
            // Delegate processing to existing WebRTCPeerManager instance
            //
            this.audioPeers[remoteUserName].processSDPMessage(message)
          }
        }
        catch (e) {
          this.$store.commit('updateErrors', `WebRTC error: ${e}`)
        }
      }
    },

    transmitAudioTo (remoteUserName) {
      console.log(`Audio connection with ${remoteUserName} has been established!`)

      // This will reactively add an <audio /> tag for communicating with this remote user
      //
      this._addOrUpdateCrewMember(remoteUserName, { audioEstablished: true })

      // Wait until DOM is updated with the <audio /> tag before transmitting
      //
      Vue.nextTick(() => this.audioPeers[remoteUserName].beginTransmittingAudio())
    },

    processReceivedVideoCommand (command) {
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
        // console.log('Broadcasting Video Event: ' + JSON.stringify(payload))
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
