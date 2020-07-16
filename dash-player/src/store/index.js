import Vue from 'vue'
import Vuex from 'vuex'

import { getField, updateField } from 'vuex-map-fields'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    globalMessages: [],
    selectedVideoUrl: null,
    password: null // TODO: Make a password page!
  },
  mutations: {
    updateField // Allows auto-generated two-way bindings from components using 'mapFields' helper
  },
  getters: {
    getField // Allows auto-generated two-way bindings from components using 'mapFields' helper
  },
  actions: {
  }
})
