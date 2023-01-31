<template>
  <el-date-picker
      v-model="value"
      type="datetime"
      placeholder="选择日期时间">
  </el-date-picker>
</template>

<script>
export default {
  name: "OnceTimeSelector",
  data() {
    return {
      value: ""
    }
  }
}
</script>

<style scoped>

</style>