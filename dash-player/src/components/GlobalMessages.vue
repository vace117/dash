<template>
  <div id="globalMessagesPanel">
    <ul v-if="isGlobalMessagesPresent" class="messageList">
        <li v-for="(msg, index) in globalMessages" :key="index">
          <span>{{msg}}</span>
        </li>
    </ul>
  </div>
</template>

<script>
export default {

  computed: {
    globalMessages () { return this.$store.state.globalMessages },

    isGlobalMessagesPresent () {
      return Array.isArray(this.globalMessages) && this.globalMessages.length > 0
    }
  }

}
</script>

<style scoped>
.messageList {
  list-style-type: none;
  padding-inline-start: 10px;
}
.messageList li {
  color: rgb(255, 102, 102);
  font-weight: bold;
  font-size: 2em;
}
.messageList li::before {
  content: url(../assets/styles/message-error-30.png);
  margin: 10px;
}
</style>
