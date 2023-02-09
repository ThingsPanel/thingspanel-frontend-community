<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-03 14:04:59
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-07 09:34:25
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\components\device\OperatorSelector.vue
 * @Description: 操作设备
-->
<template>
  <div style="display: flex">
    <el-select v-if="option.operator" style="width: 100px;margin-right:10px" placeholder="操作符" v-model="formData.symbol"
               @change="handleChange">
      <el-option v-for="(item, index) in symbolList" :key="index" :label="item" :value="item"></el-option>
    </el-select>
    <el-input style="width: 100px;margin-right:10px" v-model="formData.value" @change="handleChange"></el-input>
    {{ data.unit ? data.unit : "" }}
  </div>
</template>

<script>

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
    }
  }
}
</script>

<style scoped>

</style>