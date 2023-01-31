<template>
  <div style="display: flex">
    <el-select style="width: 100px;margin-right:10px" v-model="value">
      <el-option label="每小时" value="perHour"></el-option>
      <el-option label="每天" value="days"></el-option>
      <el-option label="每周" value="weekly"></el-option>
      <el-option label="每月" value="monthly"></el-option>
    </el-select>

    <el-input v-if="value=='perHour'"></el-input>

    <el-time-select v-else-if="value=='days'" v-model="timeValue" placeholder="选择时间"></el-time-select>

    <WeeklySelector v-else-if="value=='weekly'"/>
    <MonthlySelector v-else-if="value=='monthly'"/>
  </div>
</template>

<script>
import WeeklySelector from "./WeeklySelector";
import MonthlySelector from "./MonthlySelector";
export default {
  name: "RepeatTimeSelector",
  components: { WeeklySelector, MonthlySelector },
  data() {
    return {
      value: "",
      timeValue: ""
    }
  }
}
</script>

<style scoped>

</style>