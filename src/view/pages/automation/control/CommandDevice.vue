<!-- 操作设备 -->
<template>
  <div class="command-device-box">
    <div style="display: flex;margin-bottom: 10px" v-for="(command, index) in commands" :key="index">

      <DeviceTypeSelector :option="{operator: false}" @change="handleCommandChange"/>

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
import DeviceTypeSelector from "../components/device/DeviceTypeSelector.vue";
export default {
  name: "CommandDevice",
  components: { DeviceTypeSelector },
  data() {
    return {
      commands: [
        {

        }
      ]

    }
  },
  methods: {
    handleCommandChange(v) {
      console.log("====handleCommandChange", v);
    },
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