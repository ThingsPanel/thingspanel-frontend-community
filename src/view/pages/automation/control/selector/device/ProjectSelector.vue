<template>
  <div style="display: flex">
      <el-select style="width: 100px;margin-right:10px" v-model="value">
        <el-option label="项目1" :value="'project1'"></el-option>
      </el-select>
      <!-- 选择项目后显示分组 -->
      <GroupSelector v-if="value != ''"/>
  </div>
</template>

<script>
import GroupSelector from "./GroupSelector";
export default {
  name: "ProjectSelector",
  components: {
    GroupSelector
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