<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-02 08:39:13
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-01 13:50:56
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\components\time\MonthlySelector.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div style="display: flex">
    <el-select style="margin-right:10px" ref="dayRef" v-model="formData.day" @change="handleDayChange">
      <el-option v-for="(day, index) in dayOptions" :key="index" :label="day.label" :value="day.value"></el-option>
    </el-select>

    <el-time-select ref="timeRef" v-if="formData.day!=''" v-model="formData.time" placeholder="选择时间" @change="handleTimeChange"></el-time-select>
  </div>
</template>

<script>
import { message_error } from '@/utils/helpers';

export default {
  name: "MonthlySelector",
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
        day: "",
        time: ""
      },
      dayOptions: [],
    }
  },
  watch: {
    data: {
      handler(newValue) {
        if (newValue) {
          console.log("MonthlySelector", newValue);
          this.formData = JSON.parse(JSON.stringify(newValue));
        }
      },
      immediate: true
    }
  },
  created() {
    for (let i = 1; i <= 31; i++) {
      this.dayOptions.push({ label: i + "日", value: i})
    }
  },
  methods: {
    /**
     * @description: 日改变
     * @param {*} v
     * @return {*}
     */
    handleDayChange(v) {
      this.$emit("change", this.formData);
    },
    /**
     * @description: 
     * @param {*} v
     * @return {*}
     */
    handleTimeChange(v) {
      this.$emit("change", this.formData);
    },
    validate() {
      if (!this.formData.day || this.formData.day === "") {
        this.$refs.dayRef.focus();
        message_error("请选择日期");
        return false;
      }
      if (!this.formData.time || this.formData.time === "") {
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