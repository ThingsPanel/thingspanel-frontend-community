<template>
  <div class="container-fluid">

  </div>
</template>

<script>
import VisualAPI from "@/api/visualization.js"
export default {
  name: "VisualDisplay",
  mounted() {
    let id = this.$route.query.id;
    VisualAPI.list({ id })

    console.log("====id", id)
  },
  methods: {

  }
}
</script>

<style scoped lang="scss">
.container-fluid {
  height: 100%!important;
  padding: 20px 10px 100px 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
.header {
  color:  #fff;
  height: 60px;
  padding-bottom: 20px;
}
}
</style>