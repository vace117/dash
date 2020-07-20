import Vue from 'vue'
import Vuex from 'vuex'

import { getField, updateField } from 'vuex-map-fields'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    globalMessages: [],
    selectedVideoUrl: 'https://storage.googleapis.com/dash-video-storage/dylan/stream.mpd',
    password: null
  },
  mutations: {
    updateField, // Allows auto-generated two-way bindings from components using 'mapFields' helper

    updateErrors (state, errorTexts) {
      state.globalMessages = []

      if (Array.isArray(errorTexts)) {
        state.globalMessages.push(...errorTexts)
      } else {
        state.globalMessages.push(errorTexts)
      }
    },

    clearErrors (state) {
      state.globalMessages = []
    },

    clearPassword (state) {
      state.password = null
    }

  },

  getters: {
    getField // Allows auto-generated two-way bindings from components using 'mapFields' helper
  },

  actions: {

  }
})
