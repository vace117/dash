import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

export default new VueRouter({
  routes: [
    {
      path: '/',
      component: () => import('@/views/Login.vue')
    },
    {
      path: '/selectVideo',
      component: () => import('@/views/SelectVideo.vue')
    },
    {
      path: '/videoPlayer',
      component: () => import('@/views/VideoPlayer.vue')
    }
  ]
})
