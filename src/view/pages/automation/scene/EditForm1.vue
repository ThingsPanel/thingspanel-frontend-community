<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-03 14:04:59
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-10 19:30:09
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
      <el-form-item :label="$t('AUTOMATION.SCENE_TITLE')" required >
        <el-input ref="nameRef" v-model="formData.scenario_name"></el-input>
      </el-form-item>

      <el-form-item :label="$t('AUTOMATION.SCENE_DESCRIPTION')">
        <el-input v-model="formData.scenario_description"></el-input>
      </el-form-item>

      <el-form-item :label="$t('')" required>
        <div style="display:flex;margin-bottom: 10px;" v-for="(command, index) in formData.commands" :key="index">
          <DeviceTypeSelector ref="deviceTypeRef" style="" :data="command.data" :option="{operator: false, mode: 'action'}" @change="v=>handleCommandChange(command, v)"/>
          <!-- 新增一行 -->
          <el-button type="indigo" size="small" style="margin-left: auto"
                     v-if="index == 0" @click="handleAddCommand(command)">{{ $t('AUTOMATION.ADD_LINE')}}</el-button>

          <el-button type="danger" size="small" style="margin-left: auto"
                     v-if="index > 0" @click="handleDeleteCommand(command)">{{ $t('AUTOMATION.DELETE')}}</el-button>
        </div>
      </el-form-item>


      <div class="text-right">
        <el-button size="medium" type="cancel" @click="handleSubmit">{{ $t('AUTOMATION.SAVE')}}</el-button>
      </div>
    </el-form>
  </el-dialog>
</template>

<script>
import DeviceTypeSelector from "../components/device/DeviceTypeSelector.vue";
import Auto from "@/api/automation_1.0"
import { message_success, message_error, typeConvert } from '@/utils/helpers';
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
        console.log("handleSubmit", cmd)
        let { name, type, mode, operator } = cmd.data.state
        let instruct = {};
        let device_model = "1";
        if (mode === "custom") {
          device_model = "3";
          instruct = cmd.data.state.params;
        } else {
          device_model = "1";
          instruct[name] = typeConvert(operator.value, type);
        }
        
        return {
          action_type: "1",
          device_id: cmd.data.deviceId,
          device_model,
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
              console.log("getScene.commands", commands)
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
        let state = {};
        let stateJSON = "";
        if (cmd.device_model === "1") {
                // 属性
                state = {
                    name,
                    mode: "property",
                    operator: {
                        symbol: "",
                        value,
                    }
                }
                stateJSON = JSON.stringify(state);

            } else if (cmd.device_model === "2") {
                // 命令
                
                state = {
                    name: cmd.instruct.method,
                    mode: "command",
                    params: JSON.stringify(cmd.instruct.params)
                }
                stateJSON = JSON.parse(state);
            } else if (cmd.device_model === "3") {
                state = {
                    name: "custom",
                    mode: "custom",
                    params: JSON.parse(cmd.instruct)
                }
                stateJSON = JSON.stringify(state);

            }
        
        return {
            data: {
              projectId: cmd.business_id,
              groupId: cmd.asset_id,
              deviceId: cmd.device_id,
              state,
              stateJSON: JSON.stringify(state)
            }
        }
      })
      return commands;
    },
    validate() {
      if (!this.formData.scenario_name || this.formData.scenario_name === "") {
        this.$refs.nameRef.focus();
        message_error(this.$t('AUTOMATION.SCENE_NAME'));
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