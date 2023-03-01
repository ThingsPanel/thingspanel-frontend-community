<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-02 08:39:13
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-01 13:50:10
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\components\time\WeeklySelector.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div style="display: flex">
    <el-select style="margin-right:10px" ref="weekRef" v-model="weekValue" @change="handleChange">
      <el-option v-for="(week, index) in weekOptions" :key="index" :label="week.label" :value="week.value"></el-option>
    </el-select>

    <el-time-picker ref="timeRef" v-if="weekValue!=''" 
        v-model="timeValue" placeholder="选择时间" @change="handleChange"></el-time-picker>
  </div>
</template>

<script>
import { message_error } from '@/utils/helpers';
export default {
  name: "WeeklySelector",
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
    handleChange() {
      this.$emit("change", {week: this.weekValue, time: this.timeValue})
    },
    validate() {
      if (!this.weekValue || this.weekValue === "") {
        this.$refs.weekRef.focus();
        message_error("请选择星期");
        return false;
      }
      if (!this.timeValue || this.timeValue === "") {
        this.$refs.timeRef.focus();
        message_error("请选择时间");
        return false;
      }
      return true;
    }
  }
}
</script>

<style scoped>

</style>