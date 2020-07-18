<template>
  <div id="videoPlayerPanel">
    <div v-show="!pubSubInitCompletedInd">
      <b-spinner type="grow" variant="warning" style="width: 10em; height: 10em;" />
      <p/>
      <span style="font-size: large">Please wait...</span>
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

export default {
  data () {
    return {
      pubSubInitCompletedInd: false
    }
  },

  mounted () {
    this.$store.commit('clearErrors')

    this._initDashPlayer()

    this.$store.dispatch('subscribeToPubSubChannel')
      .then(() => {
        this.pubSubInitCompletedInd = true
      })
      .catch(error => {
        this.$store.commit('updateErrors', error)
        this.goBack()
      })

    // TODO:
    // this.dashPlayer.seek(200)
  },

  methods: {
    goBack () { this.$router.go(-1) },

    _initDashPlayer () {
      const dashjs = require('dashjs')

      this.dashPlayer = dashjs.MediaPlayer().create()
      this.dashPlayer.initialize(
        document.querySelector('#videoPlayer'),
        this.$store.state.selectedVideoUrl,
        false
      )
      this.dashPlayer.on('playbackPlaying', this.videoPlayingEventHandler)
      this.dashPlayer.on('playbackPaused',  this.videoPausedEventHandler)
    },

    videoPlayingEventHandler (payload) {
      console.log('Event recieved: ' + JSON.stringify(payload))
    },

    videoPausedEventHandler (payload) {
      console.log('Event recieved: ' + JSON.stringify(payload))
    }
  },

  computed: {
    ...mapFields(['selectedVideoUrl'])
  }

}
</script>

<style scoped>
  video {
      width: 640px;
      height: 360px;
      background-color: #666666;
  }
</style>
