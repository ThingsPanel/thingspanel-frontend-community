<template>
  <div style="display: flex">
    <el-select v-if="option.operator" style="width: 100px;margin-right:10px" placeholder="操作符" v-model="operator">
      <el-option v-for="(item, index) in operators" :key="index" :label="item" :value="item"></el-option>
    </el-select>
    <el-input style="width: 100px;margin-right:10px" v-model="value"></el-input>
  </div>
</template>

<script>
export default {
  name: "OperatorSelector",
  props: {
    option: {
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
      value: ""
    }
  }
}
</script>

<style scoped>

</style>