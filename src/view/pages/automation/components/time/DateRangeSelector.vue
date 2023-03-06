<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-03 14:04:59
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-02 14:10:33
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\components\time\DateRangeSelector.vue
 * @Description: 
-->
<template>
  <div style="display: flex">
    <el-date-picker style="margin-right:10px;width:270px" ref="startRef" :clearable="false"
      format="yyyy-MM-dd HH:mm:ss" value-format="yyyy-MM-dd HH:mm:ss"
      v-model="startValue"
      type="datetime"
      placeholder="起始时间YYYY-MM-DD hh:mm:ss" @change="handleChange">
    </el-date-picker>
    <el-date-picker style="margin-right:10px;width:270px" ref="endRef" :clearable="false"
      format="yyyy-MM-dd HH:mm:ss" value-format="yyyy-MM-dd HH:mm:ss"
      v-model="endValue"
      type="datetime"
      placeholder="结束时间YYYY-MM-DD hh:mm:ss" @change="handleChange">
    </el-date-picker>
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
    startValue: {
      get() {
        return (this.value && this.value.length > 0) ? this.value[0] : "";
      },
      set(val) {
        this.$emit("update:value", [val, this.endValue]);
      }
    },
    endValue: {
      get() {
        return (this.value && this.value.length > 1) ? this.value[1] : "";
      },
      set(val) {
        this.$emit("update:value", [this.startValue, val]);
      }
    }
  },
  methods: {
    /**
     * @description: 选择时间范围
     * @return {*}
     */    
    handleChange(v) {
      this.$emit("change", [this.startValue, this.endValue]);
    },
    validate() {
      if (!this.startValue) {
        this.$refs.startRef.focus();
        message_error("请选择起始时间段")
        return false;
      }
      if (!this.endValue) {
        this.$refs.endRef.focus();
        message_error("请选择结束时间段")
        return false;
      }
      return true;
    }
  }
}
</script>

<style scoped>

</style>