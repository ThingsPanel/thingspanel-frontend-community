<template>
  <el-dialog class="el-dark-dialog el-dark-input" title="设备配置" width="40%"
             :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false"
             :visible.sync="dialogVisible" @close="handleClose">
    <div class="container-fluid">

      <el-form ref="configForm" :model="formData" :rules="formRule" label-width="120px">
        <el-form-item v-for="(attr, index) in formAttr" :key="index" :label="attr.label" :prop="attr.dataKey">

          <el-input style="width: 80%"
              v-if="attr.type=='input' && attr.validate.type!='number'"
              v-model="formData[attr.dataKey]"
              :placeholder="attr.placeholder"></el-input>

          <el-input-number style="width: 80%"
                           v-if="attr.type=='input' && attr.validate.type=='number'"
                           v-model="formData[attr.dataKey]"
                           :placeholder="attr.placeholder"></el-input-number>

          <el-select style="width: 80%"
              v-if="attr.type=='select'" v-model="formData[attr.dataKey]">
            <el-option v-for="(option, index) in attr.options" :key="index"
                       :label="option.label" :value="option.value"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <span slot="footer" class="dialog-footer">
        <el-button @click="handleClose">取 消</el-button>
        <el-button type="primary" @click="handleSubmit">确 定</el-button>
      </span>
  </el-dialog>
</template>

<script>
import ModbusAPI from "@/api/modbus"
import {message_success} from "../../../utils/helpers";
export default {
  name: "DeviceConfigForm",
  props: {
    dialogVisible: {
      type: [Boolean],
      default: false
    },
    device: {
      type: [Object],
      default: () => {return {}}
    }
  },
  data() {
    return {
      formAttr: [],
      formData: {},
      formRule: {}
    }
  },
  watch: {
    device: {
      handler(newValue) {
        this.formData = {};
        if (JSON.stringify(newValue) == "{}" || newValue == "") {return;}
        // 获取表单的属性
        ModbusAPI.getFormAttr({ protocol_type: newValue.protocol})
          .then(({data}) => {
            if (data.code == 200 && data.data && data.data.config) {
              this.formAttr = data.data.config;
              this.formRule = this.getFormRule(this.formAttr);
              if (this.device.protocol_config != "{}" && this.device.protocol_config != "") {
                this.formData = JSON.parse(this.device.protocol_config);
              }
            }
          })
      },
    }
  },
  methods: {
    handleClose() {
      this.$emit("update:dialogVisible", false)
    },
    handleSubmit() {
      this.$refs["configForm"].validate((valid) => {
        if (valid) {
          let device = this.device;
          let config = {
            id: device.id,
            protocol_config: JSON.stringify({DeviceId: device.id, AccessToken: device.token, ...this.formData})
          }
          ModbusAPI.updateDeviceConfig(config)
              .then(({data}) => {
                if (data.code == 200) {
                  message_success("配置成功！")
                  this.handleClose();
                  this.$emit("submit");

                }
              })
        } else {
          return false;
        }
      });

    },
    getFormRule(formAttr) {
      let rules = {};
      formAttr.forEach(attr => {
        let rule = {};
        rule.required = attr.validate.required;
        rule.message = attr.validate.message;
        if (attr.validate.type) {
          rule.type = attr.validate.type;
        }
        rules[attr.dataKey] = [rule]
        })
      return rules;
    }
  }
}
</script>

<style scoped>

</style>