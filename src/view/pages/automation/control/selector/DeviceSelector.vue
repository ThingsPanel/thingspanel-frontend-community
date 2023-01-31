<template>
  <div>
    <el-select>
      <el-option label="设备1" :value="'device1'"></el-option>
    </el-select>
    <StateSelector/>
  </div>
</template>

<script>
import StateSelector from "./StateSelector";
export default {
  name: "DeviceSelector",
  components: {
    StateSelector
  }
}
</script>

<style scoped>

</style>