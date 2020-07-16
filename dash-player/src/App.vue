<template>
  <div id="rootContainer">
    <!-- Global Messages -->
    <GlobalMessages />

    <!-- Page Content -->
    <router-view/>
  </div>
</template>

<script>
export default {
  components: {
    GlobalMessages: () => import('@/components/GlobalMessages')
  }
}
</script>
