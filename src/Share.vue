<template>
    <router-view></router-view>
</template>

<script>
export default {
  components: {},
  props: {},
  data() {
    return {

    }
  },
  watch: {
    $route: {
        handler(route) {
            const { id } = route.query;
            console.log("$route", route, id);

        },immediate: true
    }
  },
  methods: {
    
  }
}
</script>
<style lang="scss" scoped>

</style>
