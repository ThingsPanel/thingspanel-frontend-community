<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-01 11:09:45
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-01 11:10:14
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\components\device\OnlineState.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div style="display: flex">
    持续
    <el-input ref="onlineRef" style="width: 100px;margin-right:10px" v-model="formData.value" @change="handleValueChange"></el-input>
    秒
  </div>
</template>

<script>
import { message_error } from '@/utils/helpers';
export default {
  name: "OnlineDuration",
  props: {
    data: {
      type: [Object],
      default: () => { return {}}
    }
  },
  data() {
    return {
      formData: {
        value: ""
      }
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
      this.$emit("change", { value: v });
    },
    validate() {
      if (!this.formData.value || this.formData.value === "") {
        this.$refs.durationRef.focus();
        message_error("请输入秒数!")
        return false;
      }
      return true;
    }
  }
}
</script>

<style scoped>

</style>