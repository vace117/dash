import Vue from 'vue'
import Vuex from 'vuex'

import router from '../router'
import { getField, updateField } from 'vuex-map-fields'
import { postServerQuery } from '@/utils/axios-utils'
import auth from '@/pubsub/authentication'

import GoogleBucket from '@/google-bucket/googleBucket'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    globalMessages: [],
    selectedVideoUrl: null,
    userName: null,
    password: null,
    fileTreeData: []
  },
  mutations: {
    updateField, // Allows auto-generated two-way bindings from components using 'mapFields' helper

    updateSelectedVideoUrl (state, url) {
      state.selectedVideoUrl = GoogleBucket.file_endpoint + url
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
    },

    updateFileTreeData (state, data) {
      state.fileTreeData = data
    }

  },

  getters: {
    getField, // Allows auto-generated two-way bindings from components using 'mapFields' helper

    errorsPresent (state) {
      return Array.isArray(state.globalMessages) && state.globalMessages.length > 0
    }
  },

  actions: {
    login (context, { errorCallback, directLink }) {
      postServerQuery({
        restEndpoint: auth.application_endpoint,
        query: JSON.stringify({ password: context.state.password })
      })
        .then(response => {
          if (response.status === 200) {
            context.commit('clearErrors')

            if (!directLink) {
              router.push({ path: '/selectVideo' })
            }
            else {
              const selectVideo = GoogleBucket.appendMPD(directLink)
              console.log(`A direct video URL was provided: ${selectVideo}. Skipping video selection.`)
              context.commit('updateSelectedVideoUrl', selectVideo)
              router.push({ path: '/videoPlayer' })
            }
          }
        })
        .catch(error => {
          if (error.response.status === 403) {
            errorCallback('Incorrect Password! Dispatching ninja drones...')
          }
          else {
            errorCallback(error)
          }
        })
    }
  }
})
