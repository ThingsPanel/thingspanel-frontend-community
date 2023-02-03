<template>
  <div style="display: flex">
    持续
    <el-input style="width: 100px;margin-right:10px" v-model="value" @change="handleValueChange"></el-input>
    秒
  </div>
</template>

<script>
export default {
  name: "OnlineDuration",
  data() {
    return {
      value: ""
    }
  },
  methods: {
    handleValueChange(v) {
      this.$emit("change", v);
    }
  }
}
</script>

<style scoped>

</style>