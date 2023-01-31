<template>
  <div style="display: flex">
    <el-select v-model="weekValue">
      <el-option v-for="(week, index) in weekOptions" :key="index" :label="week.label" :value="week.value"></el-option>
    </el-select>

    <el-time-select v-if="weekValue!=''" v-model="timeValue" placeholder="选择时间"></el-time-select>
  </div>
</template>

<script>
export default {
  name: "WeeklySelector",
  data() {
    return {
      weekValue: "",
      weekOptions: [
        { label: "周一", value: 1 },
        { label: "周二", value: 2 },
        { label: "周三", value: 3 },
        { label: "周四", value: 4 },
        { label: "周五", value: 5 },
        { label: "周六", value: 6 },
        { label: "周日", value: 7 }
      ],
      timeValue: ""
    }
  }
}
</script>

<style scoped>

</style>