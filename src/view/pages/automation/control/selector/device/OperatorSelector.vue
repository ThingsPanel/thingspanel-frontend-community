<template>
  <div style="display: flex">
    <el-select style="width: 100px;margin-right:10px" placeholder="操作符" v-model="operator">
      <el-option v-for="(item, index) in operators" :key="index" :label="item" :value="item"></el-option>
    </el-select>
    <el-input style="width: 100px;margin-right:10px" v-model="value"></el-input>
  </div>
</template>

<script>
export default {
  name: "OperatorSelector",
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