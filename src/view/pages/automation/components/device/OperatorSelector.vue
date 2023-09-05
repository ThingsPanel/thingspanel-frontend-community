<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-03 14:04:59
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-10 12:31:56
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\components\device\OperatorSelector.vue
 * @Description: 操作设备
-->
<template>
  <div style="width: 100%;display: flex;position:relative">
    <el-select :no-data-text="$t('COMMON.SELECT_NO_DATA')" ref="symbolRef" v-if="option.operator" style="width: 100px;margin-right:10px" :placeholder="$t('AUTOMATION.PLACEHOLDER.SYMBOL')" 
                v-model="formData.symbol"
               @change="handleChange">
      <el-option v-for="(item, index) in symbolList" :key="index" :label="item" :value="item"></el-option>
    </el-select>

    <template>
      <el-select :no-data-text="$t('COMMON.SELECT_NO_DATA')" style="width: 100px;margin-right:10px" v-if="chart.type === 'switch'" v-model="formData.value" @change="handleChange">
        <el-option v-for="(item, index) in formData.switchList" :key="index" :label="item.label" :value="item.value"></el-option>
      </el-select>

      <el-input-number class="el-dark-input" style="width: 140px;margin-right:10px" v-else-if="chart.type === 'slider' || chart.type==='setValue'" 
        :min="formData.min" :max="formData.max" :step="1"
        v-model="formData.value" @change="handleChange"></el-input-number>

      <el-input v-else ref="valueRef" style="width: 100px;margin-right:10px" v-model="formData.value" @change="handleChange"></el-input>
    </template>
    <span style="">
      {{ data.unit ? data.unit : "" }}
    </span>
  </div>
</template>

<script>
import { message_error, typeConvert } from '@/utils/helpers'
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
    },
    chart: {
      type: [Object],
      default: () => ({})
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
      }
    }
  },
  watch: {
    data: {
      handler(newVal) {
        console.log("DeviceTypeSelector.data", newVal)
        if (newVal) {
          if (newVal.operator) {
            this.formData = JSON.parse(JSON.stringify(newVal.operator));
            this.formData.value = this.formData.value.toString();
            // let { type } = this.data;
            // this.formData.value = typeConvert(this.formData.value, type)
          } else {
            this.formData = { symbol: "", value: "" };
          }
        }
      },
      immediate: true,
      deep: true
    },
    chart: {
      handler(newVal) {
        console.log("DeviceTypeSelector.chart", newVal)

        if (newVal && JSON.stringify(newVal) !== "{}") {
          this.symbolList = [">", ">=", "<", "<=", "==", "!=", "in", "between"];
            if (newVal.type === "switch") {
              let { on, off } = newVal.series[0].mapping;
              // let { type } = this.data;
              // on = typeConvert(on, type);
              // off = typeConvert(off, type);
              this.formData.switchList = [
                { label: "开启", value: on },
                { label: "关闭", value: off }
              ]
              this.symbolList = ["=="];
              this.formData.symbol = "==";
            } else if (newVal.type === 'slider' || newVal.type === 'setValue') {
              let map = newVal.series[0].mapping;
              this.formData.max = Number(map.max) || Number(map.attr.dataRange.split("-")[1]) || 100;
              this.formData.min =  Number(map.attr.dataRange.split("-")[0]) || 0;
              this.formData.step = Number(map.step) || Number(map.attr.stepLength) || 1;
            } else {
            }
        }
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    handleChange() {
      let data = JSON.parse(JSON.stringify(this.formData))
      if (this.option.operator === false) {
        data.symbol = "=";
      }
      // let { type } = this.data;
      // let value = typeConvert(data.value, type)
      // data.value = value;
      this.$emit("change", data);
    },
    validate() {
      if (this.option.operator && (!this.formData.symbol || this.formData.symbol === "")) {
        this.$refs.symbolRef && this.$refs.symbolRef.focus();
        message_error(this.$t('AUTOMATION.ERROR.SYMBOL'));
        return false;
      }

      let result = true;
      const type = this.data.type;
      if (type === "integer" || type === "number" || type === "float") {
        console.log("OperatorSelector.formData.value", this.formData.value.toString())
        let pattern = /^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/;
        result = pattern.test(this.formData.value.toString());
        // result = this.formData.value.toString().match(/^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/)
      }
      console.log("OperatorSelector.formData.value", result, this.formData.value)
      if (this.formData.value === "" || this.formData.value === undefined || !result) {
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