<template>
  <b-container fluid style="height: 100%">
    <!-- Global Messages -->
    <b-row>
      <b-col>
        <GlobalMessages />
      </b-col>
    </b-row>

    <!-- Page Content -->
    <b-row>
      <b-col>
        <p/>
        <router-view/>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
export default {
  components: {
    GlobalMessages: () => import('@/components/GlobalMessages')
  }
}
</script>
