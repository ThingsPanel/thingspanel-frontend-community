<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-03 14:04:59
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-20 16:23:05
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\components\time\OnceTimeSelector.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <el-date-picker ref="datePicker" v-model="formData.value" type="datetime" placeholder="选择日期时间" 
    format="yyyy-MM-dd HH:mm:ss"
    value-format="yyyy-MM-dd HH:mm:ss"
    @change="handleValueChange">
  </el-date-picker>
</template>

<script>
import { message_error } from '@/utils/helpers';
export default {
  name: "OnceTimeSelector",
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
        value: "",
      },
    }
  },
  watch: {
    data: {
      handler(newValue) {
        if (newValue) {
          this.formData = JSON.parse(JSON.stringify(newValue));
        }
      },
      immediate: true
    }
  },
  methods: {
    handleValueChange(v) {
      this.$emit("change", v);
    },
    validate() {
      if (!this.formData.value || this.formData.value === "") {
        this.$refs.datePicker.focus();
        message_error("请选择时间")
        return false;
      }
      return true;
    }
  }
}
</script>

<style scoped>

</style>