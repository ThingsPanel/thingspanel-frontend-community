<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-03 14:04:59
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-10 12:31:56
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\components\device\OperatorSelector.vue
 * @Description: 操作设备
-->
<template>
  <div style="display: flex">
    <el-select ref="symbolRef" v-if="option.operator" style="width: 100px;margin-right:10px" :placeholder="$t('AUTOMATION.PLACEHOLDER.SYMBOL')" 
    v-model="formData.symbol"
               @change="handleChange">
      <el-option v-for="(item, index) in symbolList" :key="index" :label="item" :value="item"></el-option>
    </el-select>
    <el-input ref="valueRef" style="width: 100px;margin-right:10px" v-model="formData.value" @change="handleChange"></el-input>
    {{ data.unit ? data.unit : "" }}
  </div>
</template>

<script>
import { message_error } from '@/utils/helpers'

export default {
  name: "OperatorSelector",
  props: {
    data: {
      type: [Object],
      default: () => { return { }}
    },
    option: {
      type: [Object],
      default: () => { return { operator: false }}
    }
  },
  data() {
    return {
      symbolList: [
          ">", ">=", "<", "<=", "==", "!=", "in", "between"
      ],
      formData: {
          symbol: "",
          value: ""
      },
    }
  },
  watch: {
    data: {
      handler(newValue) {
        if (newValue) {
          if (newValue.operator) {
            this.formData = JSON.parse(JSON.stringify(newValue.operator));
          } else {
            this.formData = { symbol: "", value: "" };
          }
        }
      },
      immediate: true
    }
  },
  methods: {
    handleChange() {
      if (this.option.operator === false) {
        this.formData.symbol = "=";
      }
      this.$emit("change", this.formData);
    },
    validate() {
      console.log("OperatorSelector", this.data)
      if (this.option.operator && (!this.formData.symbol || this.formData.symbol === "")) {
        this.$refs.symbolRef && this.$refs.symbolRef.focus();
        message_error(this.$t('AUTOMATION.ERROR.SYMBOL'));
        return false;
      }

      let result = true;
      const type = this.data.type;
      if (type === "integer" || type === "number" || type === "float") {
        result = this.formData.value.match(/^(0|-?[1-9]\d*)\b/)
      }
      console.log("OperatorSelector", result)
      if (!this.formData.value || this.formData.value === "" || !result) {
        this.$refs.valueRef && this.$refs.valueRef.focus();
        message_error(this.$t('AUTOMATION.ERROR.PROPERTY'));
        return false;
      }
      return true;
    }
  }
}
</script>

<style scoped>

</style>