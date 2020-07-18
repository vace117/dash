<template>
  <div id="loginPanel" class="bigScreenText">
      >>> SPEAK FRIEND AND ENTER &lt;&lt;&lt;
      <br/>
      <b-form-input v-model="password" lazy type="password" class="bigInputText" />
      <p/>
      <b-button @click.prevent="login" size="lg" variant="success">LOGIN</b-button>
    </div>
</template>

<script>
import { mapFields } from 'vuex-map-fields'

export default {
  methods: {
    login () {
      this.$router.push({ path: '/selectVideo' })
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
