<!-- 设备配置 -->
<template>
  <el-dialog class="el-dark-dialog el-dark-input" title="设备配置" width="40%"
             :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false"
             :visible.sync="dialogVisible" @close="handleClose">
    <div class="container-fluid">
      <el-tabs v-model="activeName"  @tab-click="handleClick">
        <el-tab-pane v-for="(item, index) in tabList" :key="index" :label="item.label" :name="item.value"></el-tab-pane>
      </el-tabs>

      <!-- 数据解析 -->
      <div v-if="activeName=='configParse'">
        <el-form ref="configForm" :model="formData" :rules="formRule" label-width="260px">
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

      <!-- 设备属性 -->
      <div v-else-if="activeName=='deviceAttribute'">
        <el-form label-position="left" :model="formData">
          <el-form-item label="设备位置" >
            <el-input style="width: 100%" placeholder="请输入设备经纬度，用逗号隔开，如：116.462346, 39.356432"
                      v-model="location"
              ></el-input>
          </el-form-item>
        </el-form>
      </div>

      <!-- 运维信息 -->
      <div v-else-if="activeName=='runningStatus'"></div>
    </div>

    <span slot="footer" class="dialog-footer">
        <el-button @click="handleClose">取 消</el-button>
        <el-button type="primary" @click="handleSubmit">确 定</el-button>
      </span>
  </el-dialog>
</template>

<script>
import ModbusAPI from "@/api/modbus"
import {message_success} from "../../../../../utils/helpers";
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
      activeName: "",
      tabList: [
        { value: "configParse", label: "数据解析" },
        { value: "deviceAttribute", label: "设备属性" },
        { value: "runningStatus", label: "运维信息" }
      ],
      formAttr: [],
      formData: {},
      formRule: {},
      location: ""
    }
  },
  watch: {
    device: {
      handler(newValue) {
        console.log("====handler", newValue)
        this.location = newValue.location ? newValue.location : "";
        this.formData = {};
        if (JSON.stringify(newValue) == "{}" || newValue == "") {return;}
        if (newValue.device_type == "3" || (newValue.device_type == "1" && newValue.protocol != "mqtt")) {
          // 子设备所有协议都要数据解析，直连设备所有自定义协议(mqtt协议之外)都要数据解析
          this.tabList = [
            { value: "configParse", label: "数据解析" },
            { value: "deviceAttribute", label: "设备属性" },
            { value: "runningStatus", label: "运维信息" }
          ];
          this.activeName = "configParse";
          let deviceType = newValue.device_type == "1" ? "1" : "2";
          // 获取表单的属性
          ModbusAPI.getFormAttr({ protocol_type: newValue.protocol, device_type: deviceType})
              .then(({data}) => {
                if (data.code == 200 && data.data && data.data.config) {
                  this.formAttr = data.data.config;
                  this.formRule = this.getFormRule(this.formAttr);
                  if (this.device.protocol_config != "{}"
                      && this.device.protocol_config != ""
                      && this.device.protocol_config != undefined) {
                    this.formData = JSON.parse(this.device.protocol_config);
                  }
                }
              })
        } else {
          this.tabList = [
            { value: "deviceAttribute", label: "设备属性" },
            { value: "runningStatus", label: "运维信息" }
          ]
          this.activeName = "deviceAttribute";
          this.formRule = {
            location: [
              { required: false, message: '请输入设备位置', trigger: 'change' }
            ],
          };
          console.log(this.formRule)
        }

      },
    }
  },
  methods: {
    handleClose() {
      this.$emit("update:dialogVisible", false)
    },
    handleSubmit() {
      const submit = () => {
        let device = this.device;
        let config = {
          id: device.id,
          location: this.location,
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
      }
      if (this.$refs["configForm"]) {
        this.$refs["configForm"].validate((valid) => {
          if (valid) {
            submit();
          }
        });
      } else {
        submit();
      }
    },
    handleClick() {

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