<template>
  <div class="overview-item">
    <div class="overview-icon"><i :class="icon"></i></div>
    <p class="overview-value">{{ value }}</p>
    <p class="overview-subtitle">
      <slot></slot>
    </p>
  </div>
</template>

<script>
export default {
  name: "Overview",
  props: {
    icon: {
      type: [String],
      default: ""
    },
    value: {
      type: [String, Number],
      default: ""
    }
  }
}
</script>

<style scoped>
.overview-item {
  width: 25%;
  height: 150px;
}
</style>