<template>
  <div id="videoUrlSelectionPanel" class="bigScreenText">
      Enter URL of your MPD file
      <br/>
      <!-- <input v-model.lazy="selectedVideoUrl" size="70" class="bigInputText" /> -->
      <b-form-input v-model="selectedVideoUrl" lazy type="url" class="bigInputText" />
      <p/>

      <div v-if="readyToWatchInd" >
        <b-button @click.prevent="watchVideo" size="lg" variant="success">WATCH</b-button>
        <b-button @click="goBackToLogin" size="lg" variant="warning" style="margin-left: 20px">LOGIN AGAIN</b-button>
      </div>

      <b-spinner v-else type="grow" variant="success" style="width: 0.8em; height: 0.8em;" />

    </div>
</template>

<script>
import { mapFields } from 'vuex-map-fields'

export default {
  data () {
    return {
      readyToWatchInd: true
    }
  },

  methods: {
    watchVideo () {
      this.readyToWatchInd = false
      if (this._checkVideoUrl()) {
        this.$router.push({ path: '/videoPlayer' })
      } else {
        this.readyToWatchInd = true
      }
    },

    goBackToLogin () {
      this.$router.push({ path: '/' })
    },

    _checkVideoUrl () {
      try {
        // eslint-disable-next-line no-new
        new URL(this.selectedVideoUrl)
        return true
      } catch (error) {
        this.$store.commit('updateErrors', 'The URL you specified is invalid!')
        return false
      }
    }
  },

  computed: {
    ...mapFields(['selectedVideoUrl'])
  }

}
</script>
