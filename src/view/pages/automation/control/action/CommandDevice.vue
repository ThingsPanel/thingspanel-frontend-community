<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-06 09:04:58
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-10 15:58:28
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\control\CommandDevice.vue
 * @Description: 操作设备
-->
<template>
  <div class="command-device-box">
    <div style="display: flex;margin-bottom: 10px" v-for="(command, index) in commands" :key="index">

      <DeviceTypeSelector ref="deviceTypeRef" :option="{operator: false}" :data="command" @change="v=>handleCommandChange(command, v)"/>

      <!-- 新增一行 -->
      <el-button type="indigo" size="small" style="margin-left: auto;"
                 v-if="index == 0"
                 @click="handleAddCommand">{{ $t('AUTOMATION.ADD_LINE') }}</el-button>

      <!-- 删除 -->
      <el-button type="danger" size="small" style="margin-left: auto;"
                 v-if="index > 0"
                 @click="handleDeleteCommand(command)">{{ $t('AUTOMATION.DELETE') }}</el-button>

    </div>

  </div>

</template>

<script>
import DeviceTypeSelector from "../../components/device/DeviceTypeSelector.vue";
export default {
  name: "CommandDevice",
  components: { DeviceTypeSelector },
  props: {
    data: {
      type: [Array],
      default: () => { return [] }
    }
  },
  data() {
    return {
      commands: []
    }
  },
  watch: {
    data: {
      handler(newValue) {
        if (newValue && newValue.length > 0) {
          this.commands = JSON.parse(JSON.stringify(newValue));
        } else {
          this.commands = [{}]
        }
      },
      immediate: true
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
      for (const item in v) {
        command[item] = v[item];
      }
      this.$emit("change", this.commands);
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
      let index = this.commands.findIndex(item => item == command);
      this.commands.splice(index, 1);
    },
    validate() {
      for (let index = 0; index < this.commands.length; index++) {
        if (this.$refs.deviceTypeRef && !this.$refs.deviceTypeRef[index].validate()) {
          return false;
        }
      }
      return true;
    }

  }
}
</script>

<style scoped>
.command-device-box {
  padding: 10px;
  border: 1px solid #4d96e0;
  border-radius: 6px;
}
</style>