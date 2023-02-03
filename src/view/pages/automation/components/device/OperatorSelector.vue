<template>
  <div style="display: flex">
    <el-select v-if="option.operator" style="width: 100px;margin-right:10px" placeholder="操作符" v-model="formData.symbol"
               @change="handleChange">
      <el-option v-for="(item, index) in symbolList" :key="index" :label="item" :value="item"></el-option>
    </el-select>
    <el-input style="width: 100px;margin-right:10px" v-model="formData.value" @change="handleChange"></el-input>
    {{ formData.unit }}
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
          this.formData = JSON.parse(JSON.stringify(newValue));
        }
      },
      immediate: true
    }
  },
  methods: {
    handleChange() {
      this.$emit("change", this.formData);
    }
  }
}
</script>

<style scoped>

</style>