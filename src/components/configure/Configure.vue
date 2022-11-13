<template>
  <div class="configure-item">
    <img :src="option.image_src" alt="">
  </div>
</template>

<script>
export default {
  name: "Configure",
  props: {
    option: {
      type: [Object],
      default: () => { return {}; }
    }
  }
}
</script>

<style scoped lang="scss">
.configure-item {
  width: 100%;
  height: 100%;
  img {
    width: 100%;
    height: 100%;
  }
}
</style>