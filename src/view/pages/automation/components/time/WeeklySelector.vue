<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-02 08:39:13
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-10 15:15:40
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\components\time\WeeklySelector.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div style="display: flex">
    <el-select style="margin-right:10px" ref="weekRef" v-model="weekValue" @change="handleChange">
      <el-option v-for="(week, index) in weekOptions" :key="index" :label="week.label" :value="week.value"></el-option>
    </el-select>

    <el-time-picker ref="timeRef" v-if="weekValue!=''" 
        v-model="timeValue" :placeholder="$t('AUTOMATION.PLACEHOLDER.SELECT_TIME')" @change="handleChange"></el-time-picker>
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
        { label: this.$t('AUTOMATION.WEEK.MONDAY'), value: 1 },
        { label: this.$t('AUTOMATION.WEEK.TUESDAY'), value: 2 },
        { label: this.$t('AUTOMATION.WEEK.WEDNESDAY'), value: 3 },
        { label: this.$t('AUTOMATION.WEEK.THURSDAY'), value: 4 },
        { label: this.$t('AUTOMATION.WEEK.FRIDAY'), value: 5 },
        { label: this.$t('AUTOMATION.WEEK.SATURDAY'), value: 6 },
        { label: this.$t('AUTOMATION.WEEK.SUDNAY'), value: 7 }
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
        message_error(this.$t('AUTOMATION.ERROR.WEEKLY'));
        return false;
      }
      if (!this.timeValue || this.timeValue === "") {
        this.$refs.timeRef.focus();
        message_error(this.$t('AUTOMATION.ERROR.TIME'));
        return false;
      }
      return true;
    }
  }
}
</script>

<style scoped>

</style>