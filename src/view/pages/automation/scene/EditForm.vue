<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-03 14:04:59
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-07 09:41:40
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\scene\EditForm.vue
 * @Description: 场景编辑表单
-->
<template>
  <el-dialog
      :title="formData.id ? '编辑' : '新增'"
      class="el-dark-dialog"
      :close-on-click-modal="false"
      :visible.sync="dialogVisible"
      width="60%"
      height="60%"
      top="10vh"
  >
    <el-form label-position="left" label-width="85px">
      <el-form-item label="场景标题">
        <el-input v-model="formData.name"></el-input>
      </el-form-item>

      <el-form-item label="场景描述">
        <el-input v-model="formData.describe"></el-input>
      </el-form-item>

      <el-form-item label="添加设备">
        <div style="display:flex;margin-bottom: 10px;" v-for="(command, index) in formData.commands" :key="index">
          <DeviceTypeSelector style="" :data="command.data" :option="{operator: false}" @change="v=>handleCommandChange(command, v)"/>
          <!-- 新增一行 -->
          <el-button type="indigo" size="small" style="margin-left: auto"
                     v-if="index == 0" @click="handleAddCommand(command)">新增一行</el-button>

          <el-button type="danger" size="small" style="margin-left: auto"
                     v-if="index > 0" @click="handleDeleteCommand(command)">删除</el-button>
        </div>
      </el-form-item>


      <div class="text-right">
        <el-button size="medium" type="cancel" @click="handleSubmit">保存</el-button>
      </div>
    </el-form>
  </el-dialog>
</template>

<script>
import data from "./data"
import DeviceTypeSelector from "../components/device/DeviceTypeSelector.vue";
export default {
  name: "EditForm",
  components: { DeviceTypeSelector },
  props: {
    id: {
      type: [String],
      default: ""
    },
    visible: {
      type: [Boolean],
      default: false
    }
  },
  data() {
    return {
      formData: {}
    }
  },
  computed: {
    dialogVisible: {
      get() { 
        return this.visible;
      },
      set(val) {
        this.$emit("update:visible", val);
      }
    }
  },
  watch: {
    visible: {
      handler(newValue) {
        if (newValue) {
          if (this.id) {
            this.formData = JSON.parse(JSON.stringify(data.find(item => item.id = this.id)));
          } else {
            this.formData = {commands: [{data: {}}]};
          }
        }
      }
    }
  },
  methods: {
    /**
     * @description: 新增一行命令
     * @return {*}
     */    
    handleAddCommand() {
      this.formData.commands.push({data: {}});
    },
    /**
     * @description: 保存
     * @return {*}
     */    
    handleSubmit() {
      this.dialogVisible = false;
      console.log("====scene.EditForm", this.formData)
    },
    /**
     * @description: 指定行被改变
     * @param {*} command  改变前的值
     * @param {*} v  改变后的值
     * @return {*}
     */    
    handleCommandChange(command, v) {
      command.data = v;
    },
    /**
     * @description: 删除指定行
     * @param {*} command
     * @param {*} v
     * @return {*}
     */    
    handleDeleteCommand(command) {
      let index = this.formData.commands.findIndex(item => item ==command );
      this.formData.commands.splice(index, 1);
    }
  }
}
</script>

<style scoped>

</style>