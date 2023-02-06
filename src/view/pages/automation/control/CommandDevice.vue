<!-- 操作设备 -->
<template>
  <div class="command-device-box">
    <div style="display: flex;margin-bottom: 10px" v-for="(command, index) in formData.commands" :key="index">

      <DeviceTypeSelector :option="{operator: false}" :data="command" @change="v=>handleCommandChange(command, v)"/>

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
  props: {
    data: {
      type: [Object],
      default: () => { return {} }
    }
  },
  data() {
    return {
      formData: {
        commands: [{}]
      }
    }
  },
  watch: {
    data: {
      handler(newValue) {
        if (newValue) {
          this.formData.commands = JSON.parse(JSON.stringify(newValue));
        }
      }
    }
  },
  methods: {
    /**
     * @description: 改变操作设备指令
     * @param {*} command
     * @param {*} v
     * @return {*}
     */    
    handleCommandChange(command, v) {
      let index = this.formData.commands.findIndex(item => item == command);
      this.formData.commands.splice(index, 1, v);
      this.$emit("change", this.formData);
    },
    /**
     * @description: 新增一行指令
     * @return {*}
     */    
    handleAddCommand() {
      this.commands.push({});
    },
    /**
     * @description: 删除一行指令
     * @param {*} command
     * @return {*}
     */    
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