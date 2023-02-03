<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-02 08:39:13
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-03 13:15:34
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\components\time\RepeatTimeSelector.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div style="display: flex">
    <el-select style="width: 100px;margin-right:10px" v-model="value">
      <el-option label="每小时" value="perHour"></el-option>
      <el-option label="每天" value="days"></el-option>
      <el-option label="每周" value="weekly"></el-option>
      <el-option label="每月" value="monthly"></el-option>
    </el-select>

    <el-input v-if="value=='perHour'"></el-input>

    <el-time-select v-else-if="value=='days'" v-model="timeValue" placeholder="选择时间" @change="handleDaysChange"></el-time-select>

    <WeeklySelector v-else-if="value=='weekly'" @change="handleWeeklyChange"/>

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
      timeValue: "",
      
    }
  },
  methods: {
    /**
     * @description: 改变每天重复时间
     * @param {*} v
     * @return {*}
     */
    handleDaysChange(v) {
      this.$emit("change", { type: "days", days: v });
    },
    /**
     * @description: 改变每周重复时间
     * @param {*} v
     * @return {*}
     */
    handleWeeklyChange(v) {
      this.$emit("change", { type: "weekly", weekly: v });
    }
  }
}
</script>

<style scoped>

</style>