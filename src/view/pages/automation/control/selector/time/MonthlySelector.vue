<template>
  <div style="display: flex">
    <el-select v-model="monthValue">
      <el-option v-for="(day, index) in monthOptions" :key="index" :label="day.label" :value="day.value"></el-option>
    </el-select>

    <el-time-select v-if="monthValue!=''" v-model="timeValue" placeholder="选择时间"></el-time-select>
  </div>
</template>

<script>
export default {
  name: "MonthlySelector",
  data() {
    return {
      monthValue: "",
      monthOptions: [],
      timeValue: ""
    }
  },
  created() {
    for (let i = 1; i <= 31; i++) {
      this.monthOptions.push({ label: i + "日", value: i})
    }
  }
}
</script>

<style scoped>

</style>