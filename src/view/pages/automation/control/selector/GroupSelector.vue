<template>
  <div>
    <el-select>
      <el-option label="分组1" :value="'group1'"></el-option>
    </el-select>
    <DeviceSelector/>
  </div>
</template>

<script>
import DeviceSelector from "./DeviceSelector";
export default {
  name: "GroupSelector",
  components: {
    DeviceSelector
  }
}
</script>

<style scoped>

</style>