<template>
  <div id="videoPlayerPanel">
    <video id="videoPlayer" controls></video>
    <p/>
    <b-button @click="goBack" size="lg" variant="warning">GO BACK</b-button>
  </div>
</template>

<script>
import { mapFields } from 'vuex-map-fields'

export default {
  data () {
    return {

    }
  },

  mounted () {
    const dashjs = require('dashjs')
    this.dashPlayer = dashjs.MediaPlayer().create()
    this.dashPlayer.initialize(
      document.querySelector('#videoPlayer'),
      this.$store.state.selectedVideoUrl,
      false
    )
    this.dashPlayer.on('playbackPlaying', this.videoPlayingEventHandler)
    this.dashPlayer.on('playbackPaused',  this.videoPausedEventHandler)

    // TODO:
    // this.dashPlayer.seek(200)
  },

  methods: {
    goBack () {
      this.$router.go(-1)
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
