<template>
  <b-row align-h="center" class="text-center">
    <b-col id="loginPanel" class="bigScreenText">
      >>> SPEAK FRIEND AND ENTER &lt;&lt;&lt;
      <br/>
      <b-form-input v-model="password" @keyup.enter="login" lazy type="password" class="bigInputText" />
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
      this.$store.dispatch('login')
    }
  },

  mounted () {
    this.$store.commit('clearErrors')
    this.$store.commit('clearPassword')
  },

  computed: {
    ...mapFields(['password'])
  }

}
</script>
