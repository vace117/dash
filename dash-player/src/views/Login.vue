<template>
  <b-row align-h="center" class="text-center">
    <b-col id="loginPanel" class="bigScreenText">
      >>> SPEAK FRIEND AND ENTER &lt;&lt;&lt;
      <hr class="fatHR"/>
      <br/>
      <b-row align-v="center">
        <b-col cols="3" class="text-left">Thy Name: </b-col>
        <b-col cols="7" class="p-3">
          <b-form-input v-model="userName" @keyup.enter="login" lazy type="text" class="bigInputText" autofocus />
        </b-col>
      </b-row>
      <b-row align-v="center">
        <b-col cols="3" class="text-left">Thy Secret:</b-col>
        <b-col cols="7" class="p-3">
          <b-form-input v-model="password" @keyup.enter="login" lazy type="password" class="bigInputText" />
        </b-col>
      </b-row>
      <p/>
      <b-button @click.prevent="login" type="submit" size="funsize" variant="primary">LOGIN</b-button>
    </b-col>
  </b-row>
</template>

<script>
import { mapFields } from 'vuex-map-fields'

export default {
  methods: {
    login () {
      const userName = this.$store.state.userName
      if (!userName || userName.length === 0) {
        this.$store.commit('updateErrors', 'Please enter a valid username!')
        return
      }

      const password = this.$store.state.password
      if (!password || password.length === 0) {
        this.$store.commit('updateErrors', 'Please enter the password!')
        return
      }

      this.$store.dispatch('login')
    }
  },

  mounted () {
    this.$store.commit('clearErrors')
    this.$store.commit('clearPassword')
  },

  computed: {
    ...mapFields(['userName', 'password'])
  }

}
</script>
