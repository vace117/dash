<template>
  <div id="videoUrlSelectionPanel">
      Enter URL of your MPD file
      <br/>
      <!-- <input v-model.lazy="selectedVideoUrl" size="70" class="bigInputText" /> -->
      <b-form-input v-model="selectedVideoUrl" lazy type="url" class="bigInputText" />
      <p/>
      <b-button  v-if="readyToWatchInd" @click.prevent="watchVideo" size="lg" variant="success">WATCH</b-button>
      <b-spinner v-else                 type="grow" variant="success" style="width: 0.8em; height: 0.8em;" />
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

<style scoped>
  #videoUrlSelectionPanel {
    font-size: 4em;
    font-weight: bold;
  }

  .bigInputText {
    background-color: #333333;
    color: yellowgreen;
    border: 3px solid rgb(255, 174, 0);
    padding: 10px;
    font-size: 0.3em;
    font-weight: bold;
  }

  .bigButton {
    font-size: 0.7em;
    border: 3px solid rgb(255, 174, 0);
  }
</style>
