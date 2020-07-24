import Vue from 'vue'
import Vuex from 'vuex'

import router from '../router'
import { getField, updateField } from 'vuex-map-fields'
import { postServerQuery } from '@/utils/axios-utils'
import auth from '@/pubsub/authentication'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    globalMessages: [],
    selectedVideoUrl: 'https://storage.googleapis.com/dash-video-storage/dylan/stream.mpd',
    password: null
  },
  mutations: {
    updateField, // Allows auto-generated two-way bindings from components using 'mapFields' helper

    updateSelectedVideoUrl (state, url) {
      state.selectedVideoUrl = url
    },

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
    getField, // Allows auto-generated two-way bindings from components using 'mapFields' helper

    errorsPresent (state) {
      return Array.isArray(state.globalMessages) && state.globalMessages.length > 0
    }
  },

  actions: {
    login (context) {
      postServerQuery({
        restEndpoint: auth.application_endpoint,
        query: JSON.stringify({ password: context.state.password })
      })
        .then(response => {
          if (response.status === 200) {
            context.commit('clearErrors')
            router.push({ path: '/selectVideo' })
          }
        })
        .catch(error => {
          if (error.response.status === 403) {
            context.commit('updateErrors', 'Incorrect Password! Dispatching ninja drones...')
          }
          else {
            context.commit(error)
          }
        })
    }
  }
})
