<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-02 08:39:13
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-17 20:11:15
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\components\time\RepeatTimeSelector.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div style="display: flex">
    <el-select style="width: 100px;margin-right:10px" v-model="formData.type" @change="handleTypeChange">
      <el-option label="每小时" value="perHour"></el-option>
      <el-option label="每天" value="days"></el-option>
      <el-option label="每周" value="weekly"></el-option>
      <el-option label="每月" value="monthly"></el-option>
    </el-select>

    <el-input v-if="formData.type=='perHour'" v-model="formData.perHour" @change="handlePerHourChange"></el-input>

    <el-time-select v-else-if="formData.type=='days'" v-model="formData.days" placeholder="选择时间" @change="handleDaysChange"></el-time-select>

    <WeeklySelector v-else-if="formData.type=='weekly'" :data="formData.weekly" @change="handleWeeklyChange"/>

    <MonthlySelector v-else-if="formData.type=='monthly'" :data="formData.monthly" @change="handleMonthlyChange"/>
  </div>
</template>

<script>
import WeeklySelector from "./WeeklySelector";
import MonthlySelector from "./MonthlySelector";
export default {
  name: "RepeatTimeSelector",
  components: { WeeklySelector, MonthlySelector },
  props: {
    data: {
      type: [Object],
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      formData: {
        type: "",
        perHour: "",
        day: "",
        weekly: {},
        monthly: {}
      },
    }
  },
  watch: {
    data: {
      handler(newValue) {
        if (newValue) {
          console.log("RepeatTimeSelector", newValue);
          this.formData = JSON.parse(JSON.stringify(newValue));
        }
      },
      immediate: true
    }
  },
  methods: {
    /**
     * @description: 类型改变
     * @param {*} v
     * @return {*}
     */
     handleTypeChange(v) {
      this.$emit("change", { type: v })
    },
    /**
     * @description: 每小时
     * @param {*} v
     * @return {*}
     */
     handlePerHourChange(v) {
      this.$emit("change", { type: "perHour", perHour: v})
    },
    /**
     * @description: 每天
     * @param {*} v
     * @return {*}
     */
    handleDaysChange(v) {
      console.log("handleDaysChange")
      this.$emit("change", { type: "days", days: v });
    },
    /**
     * @description: 每周
     * @param {*} v
     * @return {*}
     */
    handleWeeklyChange(v) {
      this.$emit("change", { type: "weekly", weekly: v });
    },
    /**
     * @description: 每月
     * @param {*} v
     * @return {*}
     */
    handleMonthlyChange(v) {
      this.$emit("change", { type: "monthly", monthly: v });
    }
  }
}
</script>

<style scoped>

</style>