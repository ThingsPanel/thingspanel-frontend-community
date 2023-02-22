<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-02 08:39:13
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-21 09:26:01
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\components\time\RepeatTimeSelector.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div style="display: flex">
    <el-select ref="typeRef" style="width: 100px;margin-right:10px" v-model="formData.type" @change="handleTypeChange">
      <el-option label="每小时" value="perHour"></el-option>
      <el-option label="每天" value="days"></el-option>
      <el-option label="每周" value="weekly"></el-option>
      <el-option label="每月" value="monthly"></el-option>
      <el-option label="自定义cron" value="cron"></el-option>
    </el-select>

    <el-input ref="perHourRef" v-if="formData.type=='perHour'" v-model="formData.perHour" @change="handlePerHourChange"></el-input>

    <el-time-select ref="daysRef" v-else-if="formData.type=='days'" v-model="formData.days" placeholder="选择时间" @change="handleDaysChange"></el-time-select>

    <WeeklySelector ref="weeklyRef" v-else-if="formData.type=='weekly'" :data="formData.weekly" @change="handleWeeklyChange"/>

    <MonthlySelector ref="monthlyRef" v-else-if="formData.type=='monthly'" :data="formData.monthly" @change="handleMonthlyChange"/>

    <el-input ref="cronRef" v-if="formData.type=='cron'" v-model="formData.cron" @change="handleCronChange"></el-input>

  </div>
</template>

<script>
import WeeklySelector from "./WeeklySelector";
import MonthlySelector from "./MonthlySelector";
import { message_error } from '@/utils/helpers';

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
        monthly: {},
        cron: ""
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
    },
    /**
     * @description: cron
     * @param {*} v
     * @return {*}
     */    
    handleCronChange(v) {
      this.$emit("change", { type: "cron", cron: v})
    },
    /**
     * @description: 验证
     * @return {*}
     */    
    validate() {
      if (!this.formData.type || this.formData.type === "") {
        this.$refs.typeRef.focus();
        message_error("请选择日期类型");
        return false;
      }
      if (this.formData.type==='perHour' && (!this.formData.perHour || this.formData.perHour==="")) {
        this.$refs.perHourRef.focus();
        message_error("请输入每小时执行次数");
        return false;
      }
      if (this.formData.type==='days' && (!this.formData.days || this.formData.days==="")) {
        this.$refs.daysRef.focus();
        message_error("请输入每天的执行时间");
        return false;
      }
      if (this.formData.type==='cron' && (!this.formData.cron || this.formData.cron==="")) {
        this.$refs.cronRef.focus();
        message_error("请输入自定义Cron");
        return false;
      }
      if (this.$refs.weeklyRef && !this.$refs.weeklyRef.validate()) {
        return false;
      }
      if (this.$refs.monthlyRef && !this.$refs.monthlyRef.validate()) {
        return false;
      }
      return true;
    }
  }
}
</script>

<style scoped>

</style>