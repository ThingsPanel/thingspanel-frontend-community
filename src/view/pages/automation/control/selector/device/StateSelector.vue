<template>
  <div style="display: flex">
    <el-select style="width: 100px;margin-right:10px" v-model="value">
      <!-- 属性-->
      <el-option label="属性" :value="'property'"></el-option>
      <!-- 在线状态-->
      <el-option label="在线状态" :value="'onlineDuration'"></el-option>
    </el-select>

    <!-- 操作符 -->
    <OperatorSelector v-if="value=='property'"/>
    <!-- 在线持续时间 -->
    <OnlineDuration v-else-if="value=='onlineDuration'"/>
  </div>


</template>

<script>
import OperatorSelector from "./OperatorSelector";
import OnlineDuration from "./OnlineDuration";
export default {
  name: "StateSelector",
  components: {
    OperatorSelector, OnlineDuration
  },
  data() {
    return {
      value: ""
    }
  }
}
</script>

<style scoped>

</style>