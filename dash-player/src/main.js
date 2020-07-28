import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// import { BootstrapVue } from 'bootstrap-vue'
import { LayoutPlugin, FormInputPlugin, ButtonPlugin, SpinnerPlugin, ModalPlugin } from 'bootstrap-vue'

import '@/assets/styles/global-styles.scss'

require('log-timestamp')(() => {
  const messageTime = new Date()
  return `[${messageTime.toLocaleString('en-CA')} <${messageTime.getMilliseconds()}ms>]`
})

Vue.use(LayoutPlugin)
Vue.use(FormInputPlugin)
Vue.use(ButtonPlugin)
Vue.use(SpinnerPlugin)
Vue.use(ModalPlugin)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
