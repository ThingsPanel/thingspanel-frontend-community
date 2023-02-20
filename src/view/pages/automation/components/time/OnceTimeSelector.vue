<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-03 14:04:59
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-17 17:10:13
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\components\time\OnceTimeSelector.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <el-date-picker v-model="timeValue" type="datetime" placeholder="选择日期时间" 
        format="yyyy-MM-dd HH:mm:ss"
        value-format="yyyy-MM-dd HH:mm:ss"
        @change="handleValueChange">
  </el-date-picker>
</template>

<script>
export default {
  name: "OnceTimeSelector",
  props: {
    value: {
      type: [String],
      default: ""
    }
  },
  data() {
    return {
    }
  },
  computed: {
    timeValue: {
      get() {
        console.log("OnceTimeSelector", this.value)
        return this.value;
      }
    }
  },
  methods: {
    handleValueChange(v) {
      this.$emit("change", v);
    }
  }
}
</script>

<style scoped>

</style>