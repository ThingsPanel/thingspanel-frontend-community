<template>
  <div class="main-switch">
    <el-button type="primary" @click="handleOn">开启</el-button>
    <el-button type="primary" @click="handleOff">关闭</el-button>

  </div>
</template>

<script>
export default {
  name: "MainSwitch",
  methods: {
    handleOn() {
      this.$emit("on");
    },
    handleOff() {
      this.$emit("off");
    }
  }
}
</script>

<style scoped>

</style>