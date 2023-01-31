<template>
  <div>
    <el-select placeholder="操作符">
      <el-option v-for="(item, index) in operators" :key="index" :label="item" :value="item"></el-option>
    </el-select>
  </div>
</template>

<script>
export default {
  name: "OperatorSelector",
  data() {
    return {
      operators: [
          ">", ">=", "<", "<=", "==", "!=", "in", "between"
      ]
    }
  }
}
</script>

<style scoped>

</style>