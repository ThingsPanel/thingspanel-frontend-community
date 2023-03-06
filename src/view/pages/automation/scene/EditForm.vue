<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-03 14:04:59
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-02 14:58:03
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
      <el-form-item label="场景标题" required >
        <el-input ref="nameRef" v-model="formData.scenario_name"></el-input>
      </el-form-item>

      <el-form-item label="场景描述">
        <el-input v-model="formData.scenario_description"></el-input>
      </el-form-item>

      <el-form-item label="添加设备" required>
        <div style="display:flex;margin-bottom: 10px;" v-for="(command, index) in formData.commands" :key="index">
          <DeviceTypeSelector ref="deviceTypeRef" style="" :data="command.data" :option="{operator: false}" @change="v=>handleCommandChange(command, v)"/>
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
import Auto from "@/api/automation_1.0"
import { message_success, message_error } from '@/utils/helpers';
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
      formData: {
        scenario_name: "",
        scenario_description: ""
      }
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
            // 编辑
            this.getScene(this.id);
            // this.formData = JSON.parse(JSON.stringify(data.find(item => item.id = this.id)));
          } else {
            // 新增
            this.formData = {
              scenario_name: "",
              scenario_description: "",
              commands: [
                {
                  data: {}
                }
              ]
            };
          }
        } else {
          this.formData = {};
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
      if (!this.validate()) {
        return;
      }
      // 
      let params = JSON.parse(JSON.stringify(this.formData));
      params.scenario_actions = this.formData.commands.map(cmd => {
        let { name, type, operator } = cmd.data.state
        let instruct = {};
        instruct[name] = this.jsonTypeConvert(type, operator.value);
        return {
          action_type: "1",
          device_id: cmd.data.deviceId,
          device_model: "1",
          instruct: JSON.stringify(instruct),
          remark: "备注"
          
        }
      })
      if (!this.formData.id) {
        Auto.Scene.add(params)
          .then(({data}) => {
            if (data.code === 200) {
              this.dialogVisible = false;
              this.$emit("submit");
              message_success("新增成功!");
            }
          })
      } else {
        Auto.Scene.edit(params)
          .then(({data}) => {
            if (data.code === 200) {
              this.dialogVisible = false;
              this.$emit("submit");
              message_success("编辑成功!");
            }
          })
      }
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
    },
    getScene(id) {
      Auto.Scene.get({id})
        .then(({data}) => {
          if (data.code === 200) {
            let result = data?.data || "{}";
            if (result !== "{}") {
              let commands = this.getCommands(JSON.parse(JSON.stringify(result)))
              let tmp = JSON.parse(JSON.stringify(result));
              tmp.commands = commands;
              this.formData = tmp;
            }
          }
        })
    },
    getCommands(v) {
      let cmds = v?.scenario_actions || [];
      let commands = cmds.map(cmd => {
        let p = JSON.parse(cmd.instruct);
        let name = Object.keys(p)[0];
        let value = p[name];
        return {
            data: {
              projectId: cmd.business_id,
              groupId: cmd.asset_id,
              deviceId: cmd.device_id,
              state: {
                name,
                mode: "property",
                operator: {
                    symbol: "",
                    value
                }
              }
            }
        }
      })
      return commands;
    },
    validate() {
      if (!this.formData.scenario_name || this.formData.scenario_name === "") {
        this.$refs.nameRef.focus();
        message_error("请输入场景名称！");
        return false;
      }
      for(let i=0; i < this.$refs.deviceTypeRef.length; i++) {
        const ref = this.$refs.deviceTypeRef[i];
        if (!ref.validate()) return false;
      }
      return true;
    }
  }
}
</script>

<style scoped>

</style>