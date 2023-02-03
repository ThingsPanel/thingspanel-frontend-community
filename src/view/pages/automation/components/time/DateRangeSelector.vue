<template>
  <div style="display: flex">
    <el-time-picker
        is-range
        v-model="value"
        range-separator="至"
        value-format="hh:MM"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        placeholder="选择时间范围" @change="handleChange">
    </el-time-picker>
  </div>
</template>

<script>
export default {
  name: "DateRangeSelector",
  data() {
    return {
      value: ""
    }
  },
  methods: {
    /**
     * @description: 选择时间范围
     * @return {*}
     */    
    handleChange(v) {
      console.log("====handleChange", v);
      this.$emit("change", v);
    }
  }
}
</script>

<style scoped>

</style>