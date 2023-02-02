<template>
  <div style="display: flex">
    <el-select v-if="option.operator" style="width: 100px;margin-right:10px" placeholder="操作符" v-model="formData.state.operator.symbol"
               @change="handleChange">
      <el-option v-for="(item, index) in operators" :key="index" :label="item" :value="item"></el-option>
    </el-select>
    <el-input style="width: 100px;margin-right:10px" v-model="formData.state.operator.value" @change="handleChange"></el-input>
    {{ property.unit }}
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
      default: () => { return { }}
    },
    property: {
      type: [Object],
      default: () => { return { }}
    }
  },
  data() {
    return {
      operators: [
          ">", ">=", "<", "<=", "==", "!=", "in", "between"
      ],
      operator: "",
      formData: {
        state: {
          operator: {
            symbol: "",
            value: ""
          }
        }
      },
    }
  },
  watch: {
    data: {
      handler(newValue) {
        if (newValue) {
          let data = JSON.parse(JSON.stringify(newValue));
          data.state.operator = data.state.operator ? data.state.operator : { symbol: "", value: ""}
          this.formData = data;
        }
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    handleChange() {
      this.$emit("update:data", this.formData);
    }
  }
}
</script>

<style scoped>

</style>