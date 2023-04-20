<template>
  <div class="other-item" >
    <div v-if="option.type == 'text'">
      <span class="item-text">{{ value ? value : option.title }}</span>
    </div>
    <div v-else>
      <img :src="option.image_src" alt="">
    </div>
  </div>
</template>

<script>
export default {
  name: "Other",
  props: {
    option: {
      type: [Object],
      default: () => { return {}; }
    },
    value: {
      type: [String, Number],
      default: ""
    },
    defaultStyle: {
      type: [Object],
      default: () => { return {}; }
    }
  },
  data() {
    return {
    }
  },
  watch: {
    option: {
      handler(newValue) {
        console.log("====other.newValue", newValue)
      },
      immediate: true,
      deep: true
    },
    defaultStyle: {
      handler(newValue) {
        console.log("====defaultStyle", newValue)
      },
      immediate: true
    },
  }
}
</script>

<style scoped- lang="scss">
.other-item {
  width: 100%;
  height: 100%;
  img {
    width: 100%;
    height: 100%;
  }
  .item-text {
    color: #fff;
    font-size: 2rem;
  }
}
el-input {
  background-color: transparent;
}
</style>