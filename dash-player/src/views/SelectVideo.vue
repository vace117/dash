<template>
  <div id="videoUrlSelectionPanel">
    <div class="centeredContent">
      Enter URL of your MPD file
      <br/>
      <!-- <input v-model.lazy="selectedVideoUrl" size="70" class="bigInputText" /> -->
      <b-form-input v-model="selectedVideoUrl" lazy type="url" class="bigInputText"
        placeholder="https://storage.googleapis.com/dash-video-storage/dylan/stream.mpd" />
      <p/>
      <b-button size="lg" variant="success">WATCH</b-button>
    </div>
  </div>
</template>

<script>
import { mapFields } from 'vuex-map-fields'

export default {
  data () {
    return {

    }
  },

  computed: {
    ...mapFields(['selectedVideoUrl'])
  }

}
</script>

<style scoped>
  #videoUrlSelectionPanel {
    width: 100%;
    height: 90%;
    display: table;
    text-align: center;
  }

  .centeredContent {
    display: table-cell;
    vertical-align: middle;
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
