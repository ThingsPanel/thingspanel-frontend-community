<template>
  <el-date-picker v-model="value" type="datetime" placeholder="选择日期时间" 
        @change="handleValueChange">
  </el-date-picker>
</template>

<script>
export default {
  name: "OnceTimeSelector",
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