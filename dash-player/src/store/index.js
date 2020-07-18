import Vue from 'vue'
import Vuex from 'vuex'

import { getField, updateField } from 'vuex-map-fields'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    //    globalMessages: ['Something went very wrong! I dont know what to do. Please help me!', 'What do we do now?'],
    globalMessages: [],
    selectedVideoUrl: 'https://storage.googleapis.com/dash-video-storage/dylan/stream.mpd',
    password: null // TODO: Make a password page!
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

    updatePubSubChannel (state, newChannel) {
      state.pubSubChannel = newChannel
    }

  },

  getters: {
    getField // Allows auto-generated two-way bindings from components using 'mapFields' helper
  },

  actions: {
    subscribeToPubSubChannel ({ state, commit }) {
      return new Promise((resolve, reject) => {
        createOrSubscribeToChannelForVideo({
          selectedVideoURL: state.selectedVideoUrl,
          password:         state.password
        })
          .then(channel => {
            commit('updatePubSubChannel', channel)
            resolve(channel)
          })
          .catch(error => reject(error))
      })
    }

  }
})
