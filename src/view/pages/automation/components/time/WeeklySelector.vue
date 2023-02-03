<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-02 08:39:13
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-03 12:54:59
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\components\time\WeeklySelector.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div style="display: flex">
    <el-select v-model="weekValue" @change="handleChange">
      <el-option v-for="(week, index) in weekOptions" :key="index" :label="week.label" :value="week.value"></el-option>
    </el-select>

    <el-time-select v-if="weekValue!=''" v-model="timeValue" placeholder="选择时间" @change="handleChange"></el-time-select>
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
  },
  methods: {
    handleChange() {
      this.$emit("change", {week: this.weekValue, time: this.timeValue})
    }
  }
}
</script>

<style scoped>

</style>