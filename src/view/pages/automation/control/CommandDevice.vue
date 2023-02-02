<!-- 操作设备 -->
<template>
  <div class="command-device-box">
    <div style="display: flex;margin-bottom: 10px" v-for="(command, index) in commands" :key="index">

      <ProjectSelector :option="{operator: false}"/>

      <!-- 新增一行 -->
      <el-button type="indigo" size="small" style="margin-left: auto"
                 v-if="index == 0"
                 @click="handleAddCommand">新增一行</el-button>

      <!-- 删除 -->
      <el-button type="danger" size="small" style="margin-left: auto"
                 v-if="index > 0"
                 @click="handleDeleteCommand(command)">删除</el-button>

    </div>
  </div>

</template>

<script>
import ProjectSelector from "../components/device/ProjectSelector";
export default {
  name: "CommandDevice",
  components: { ProjectSelector },
  data() {
    return {
      commands: [
        {

        }
      ]

    }
  },
  methods: {
    handleAddCommand() {
      this.commands.push({});
    },
    handleDeleteCommand(command) {

    }

  }
}
</script>

<style scoped>
.command-device-box {
  padding: 10px;
  border: 1px solid #2c3e50;
}
</style>