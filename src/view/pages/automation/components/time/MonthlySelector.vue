<template>
  <div style="display: flex">
    <el-select v-model="formData.day" @change="handleDayChange">
      <el-option v-for="(day, index) in dayOptions" :key="index" :label="day.label" :value="day.value"></el-option>
    </el-select>

    <el-time-select v-if="formData.day!=''" v-model="formData.time" placeholder="选择时间" @change="handleTimeChange"></el-time-select>
  </div>
</template>

<script>
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
    }
  }
}
</script>

<style scoped>

</style>