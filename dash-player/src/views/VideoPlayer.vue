<template>
  <div id="videoPlayerPanel">
    Video Player is here
  </div>
</template>

<script>
import { mapFields } from 'vuex-map-fields'

export default {
  data () {
    return {

    }
  },

  methods: {
  },

  computed: {
    ...mapFields(['selectedVideoUrl'])
  }

}
</script>

<style scoped>
</style>
