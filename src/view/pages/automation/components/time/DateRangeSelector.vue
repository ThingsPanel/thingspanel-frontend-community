<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-03 14:04:59
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-20 16:57:11
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\components\time\DateRangeSelector.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div style="display: flex">
    <el-time-picker ref="timePickerRef"
        is-range
        v-model="rangeValue"
        range-separator="至"
        value-format="hh:MM"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        placeholder="选择时间范围" @change="handleChange">
    </el-time-picker>
  </div>
</template>

<script>
import { message_error } from '@/utils/helpers';

export default {
  name: "DateRangeSelector",
  props: {
    value: {
      type: [Array],
      default: () => ['', '']
    }
  },
  data() {
    return {
      
    }
  },
  computed: {
    rangeValue: {
      get() {
        return this.value || ['', ''];
      },
      set(val) {
        this.$emit("update:value", val)
      }
    }
  },
  methods: {
    /**
     * @description: 选择时间范围
     * @return {*}
     */    
    handleChange(v) {
      this.$emit("change", v);
    },
    validate() {
      if (!this.rangeValue || this.rangeValue.length == 0 || this.rangeValue[0] == "" || this.rangeValue[1] == "") {
        this.$refs.timePickerRef.focus();
        message_error("请选择时间段")
        return false;
      }
      return true;
    }
  }
}
</script>

<style scoped>

</style>