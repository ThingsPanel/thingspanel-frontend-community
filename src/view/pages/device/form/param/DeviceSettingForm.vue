<template>
  <el-dialog
      class="el-dark-dialog el-dark-input"
      :visible.sync="dialogVisible"
      title="编辑参数"
      :close-on-click-modal="false"
      width="40%">

    <el-form :model="deviceData" label-width="120px">

      <el-form-item label="传输协议：">
        <el-select size="medium" placeholder="请选择协议" v-model="deviceData.protocol" @change="handleChange">
          <el-option v-for="option in protocolOptions" :key="option.value" :label="option.label" :value="option.value"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="认证方式：">
        <el-select size="medium" placeholder="请选择认证方式" v-model="deviceData.authMode"
                   :disabled="true"
                   @change="handleChange()">
          <el-option :label="'AccessToken接入'" :value="'accessToken'"></el-option>
          <el-option :label="'MQTT Basic'" :value="'mqttBasic'"></el-option>
          <el-option :label="'X.509'" :value="'x509'"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="Access Token:">
        <el-input size="medium" v-model="deviceData.token"></el-input>
      </el-form-item>

      <el-form-item label="">
          <el-input type="textarea" :disabled="true"
                    autosize :readonly="true"
                    v-model="deviceData.defaultSetting">
          </el-input>
      </el-form-item>

      <div style="margin: 10px 0;"></div>

      <el-form-item label="数据交换格式：">
        <el-select size="medium" placeholder="" v-model="deviceData.dataExchangeAgreement" >
          <el-option :label="'ThingsPanel官方单设备协议'" :value="'TPSingleProtocol'"></el-option>
          <el-option :label="'ThingsPanel官方网关协议'" :value="'TPGatewayProtocol'"></el-option>
          <el-option :label="'自定义协议'" :value="'custom'"></el-option>
        </el-select>
      </el-form-item>

        <div style="display: flex;justify-content: center">
          <el-button @click="onCancel">取消</el-button>
          <el-button type="primary" @click="onSubmit">保存</el-button>
        </div>

    </el-form>

  </el-dialog>
</template>

<script>
import {defineComponent, ref, reactive, watch } from "@vue/composition-api";
import {device_default_setting} from "@/api/device";
import {getDeviceInfo} from "@/api/device";
import {updateDeviceInfo} from "../../../../../api/device";
import {message_success} from "../../../../../utils/helpers";

export default defineComponent({
  name: "DeviceSettingForm",
  props: {
    dialogVisible: {
      type: [Boolean],
      default: false
    },
    device_item: {
      type: Object,
      required: true,
    }
  },
  emits: ['change', 'cancel'],
  setup(props, context){

    console.log("deviceSettingForm")
    let device = {};
    let defaultSettings = {};

    /**
     * 监听显示状态，打开对话框时获取设备信息
     */
    watch(() => props.dialogVisible, value => {
      if (value) {
        device = props.device_item;

        getDeviceInformation();
        console.log("defaultSettings", defaultSettings)
      }
    })

    /**
     * 获取设备信息
     */
    function getDeviceInformation() {
      getDeviceInfo({ id: device.id })
          .then(({data}) => {
            if (data.code == 200) {
              console.log("getDeviceInformation", data.data)
              device = data.data;
              initForm();
            }
          })
    }

    // 传输协议下拉列表
    let protocolOptions = ref([]);
    let deviceData = reactive({
      protocol: "",
      authMode: "accessToken",
      token: "",
      defaultSetting: "",
      dataExchangeAgreement: ""
    });

    /**
     * 初始化表单
     */
    function initForm() {
      if (device.device_type == "1" || device.device_type == 1) {
        protocolOptions.value = [{label: "MQTT", value: "mqtt"}];
        deviceData.dataExchangeAgreement = "TPSingleProtocol";
      } else {
        protocolOptions.value = [{label: "MODBUS_TCP", value: "MODBUS_TCP"}, {label: "MODBUS_RTU", value: "MODBUS_RTU"}];
        deviceData.dataExchangeAgreement = "TPGatewayProtocol";
      }
      deviceData.id = device.id;
      deviceData.protocol = device.protocol;
      deviceData.authMode = "accessToken";
      deviceData.token = device.token;
      deviceData.errors = {};


      // 获取默认token和默认配置说明
      getDefaultSetting(device.protocol);
    }

    /**
     * 点击取消
     */
    function onCancel() {
      context.emit("update:dialogVisible", false);
    }

    /**
     * 点击提交
     */
    function onSubmit() {
      updateDeviceInfo(deviceData)
        .then(({data}) => {
          if (data.code == 200) {
            message_success("更新成功！")
            onCancel();
          }
        })
      // context.emit('change', deviceData);
    }

    /**
     * 协议更改
     */
    function handleChange(v){
      console.log("handleChange", v)
      getDefaultSetting(v);
    }




    /**
     * 获取token和配置说明
     */
    function getDefaultSetting(protocol) {
      if (!protocol) return;
      deviceData.defaultSetting = defaultSettings[protocol.toLowerCase()];
    }

    getDefaultSettings();
    function getDefaultSettings() {
      let protocols = ["mqtt", "MODBUS_TCP", "MODBUS_RTU"];
      defaultSettings = {};
      for (let p of protocols) {
        device_default_setting({ protocol: p})
            .then(({data}) => {
              if (data.code == 200) {
                defaultSettings[p.toLowerCase()] = data.data.default_setting.split("$$").join("\n");
              }
            })
      }
    }


    return {
      protocolOptions,
      deviceData,
      onCancel,
      onSubmit,
      handleChange,
    }
  }
})
</script>

<style scoped>

</style>