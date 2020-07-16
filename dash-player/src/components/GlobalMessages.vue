<template>
    <div id="globalMessagesPanel">
        <transition name="fade" mode="out-in">
          <ul v-if="isGlobalMessagesPresent" style="list-style-type:none;margin: 0; padding-left: 5px; padding-top: 2px;">
              <li class="errorsWithImage" v-for="msg in globalMessages" :key="msg.id">
                <span>{{msg.message ? msg.message : 'EMPTY MESSAGE!'}}</span>
              </li>
          </ul>
        </transition>
    </div>
</template>

<script>
export default {

  computed: {
    globalMessages () { return this.$store.globalMessages },

    isGlobalMessagesPresent () {
      return Array.isArray(this.globalMessages) && this.globalMessages.length > 0
    }
  }

}
</script>
