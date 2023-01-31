<template>
  <div>
    <el-select>
      <!-- 设备条件-->
      <el-option label="属性" :value="'property'"></el-option>
      <!-- 时间条件-->
      <el-option label="在线状态" :value="'status'"></el-option>
    </el-select>
    <OperatorSelector/>
  </div>
</template>

<script>
import OperatorSelector from "./OperatorSelector";
export default {
  name: "StateSelector",
  components: {
    OperatorSelector
  }
}
</script>

<style scoped>

</style>