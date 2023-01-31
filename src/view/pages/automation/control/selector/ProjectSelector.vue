<template>
  <div>
    <el-select>
      <el-option label="项目1" :value="'project1'"></el-option>
    </el-select>
    <DeviceSelector/>
  </div>
</template>

<script>
import GroupSelector from "./GroupSelector";
export default {
  name: "ProjectSelector",
  components: {
    GroupSelector
  }
}
</script>

<style scoped>

</style>