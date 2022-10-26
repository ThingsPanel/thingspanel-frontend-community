<template>
  <el-dialog
      class="el-dark-dialog el-dark-input" :append-to-body="true"
      :visible.sync="dialogVisible"
      title="编辑参数"
      :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false"
      width="40%">

    <el-form :model="deviceData" :rules="formRule" label-width="130px">

      <el-form-item label="传输协议：" prop="protocol">
        <el-select size="medium" placeholder="请选择协议" v-model="deviceData.protocol" @change="handleChange">
          <el-option v-for="option in protocolOptions" :key="option.value" :label="option.label" :value="option.value"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="认证方式：" prop="authMode">
        <el-select size="medium" placeholder="请选择认证方式" v-model="deviceData.authMode"
                   @change="handleAuthModeChange()">
          <el-option :label="'AccessToken接入'" :value="'accessToken'"></el-option>
          <el-option :label="'MQTT Basic'" :value="'mqttBasic'"></el-option>
          <el-option :disabled="true" :label="'X.509'" :value="'x509'"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item v-if="deviceData.authMode=='accessToken'" label="Access Token：" prop="token">
        <el-input size="medium" v-model="deviceData.token"></el-input>
      </el-form-item>

      <el-form-item v-if="deviceData.authMode=='mqttBasic'" label="用户名：" prop="username">
        <el-input size="medium" v-model="deviceData.username"></el-input>
      </el-form-item>

      <el-form-item v-if="deviceData.authMode=='mqttBasic'" label="密码：" prop="password">
        <el-input size="medium" v-model="deviceData.password"></el-input>
      </el-form-item>

      <el-form-item label="连接信息：">
          <el-input type="textarea" :disabled="true"
                    autosize :readonly="true"
                    v-model="deviceData.defaultSetting">
          </el-input>
      </el-form-item>

      <div style="margin: 10px 0;"></div>

      <el-form-item label="数据处理脚本：">
        <el-select size="medium" placeholder="" filterable
                   popper-class="exchange-agreement" :popper-append-to-body="false"
                   v-model="deviceData.dataExchangeAgreement"
                   @change="handleExchangeAgreementChange">
          <el-option-group >
            <el-option :label="'默认'" :value="''"></el-option>
            <el-option :label="'自定义协议'" :value="'custom'"></el-option>
          </el-option-group>

          <el-option-group >
            <el-option v-for="option in customExchangeAgreementList" :key="option.value"
                     :value="option.value" :label="option.label">
              <span style="float: left;width: 200px">{{ option.label }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">
                <el-button icon="el-icon-edit-outline"  size="mini" @click="handleShowExchangeAgreementDialog(option)"></el-button>

                <el-button icon="el-icon-delete"  size="mini" @click="handleDeleteExchangeAgreement(option)"></el-button>
              </span>
            </el-option>
          </el-option-group>

        </el-select>
      </el-form-item>

        <div style="display: flex;justify-content: center">
          <el-button style="color:#000" @click="onCancel">取消</el-button>
          <el-button type="primary" @click="onSubmit">保存</el-button>
        </div>

    </el-form>

    <!--    数据交换格式-->
    <custom-exchange-agreement :dialog-visible.sync="customExchangeAgreementVisible"
                            :data="exchangeAgreementData" :device="deviceData" @submit="handleAddExchangeAgreement"
    ></custom-exchange-agreement>
  </el-dialog>
</template>

<script>
import {defineComponent, ref, reactive, watch } from "@vue/composition-api";
import {device_default_setting} from "@/api/device";
import {getDeviceInfo, updateDeviceInfo} from "@/api/device";
import {message_success} from "@/utils/helpers";
import CustomExchangeAgreement from "./CustomExchangeAgreement";
import { getCustomExchangeAgreementList } from "@/api/device";
import {message_confirm} from "@/utils/helpers";
import DictAPI from "@/api/dict"
import {deleteCustomExchangeAgreement} from "../../../../../api/device";
export default defineComponent({
  name: "DeviceSettingForm",
  components: {
    CustomExchangeAgreement
  },
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

    let device = {};
    let defaultSettings = {};

    const required = true;
    let formRule = ref({
      protocol: [ {required, message: "传输协议不能为空"}],
      token: [ {required, message: "Access Token不能为空"}],
      username: [ {required, message: "用户名不能为空"}],
      password: [ {required, message: "密码不能为空"}],
      dataExchangeAgreement: [ {required, message: "数据交换格式不能为空"}]
    })

    /**
     * 监听显示状态，打开对话框时获取设备信息
     */
    watch(() => props.dialogVisible, value => {
      if (value) {
        device = props.device_item;
        getDeviceInformation();
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
    // 表单数据
    let deviceData = reactive({
      protocol: "",
      authMode: "accessToken",
      token: "",
      username: "",
      password: "",
      defaultSetting: "",
      dataExchangeAgreement: "",
      errors: {}
    });

    /**
     * 初始化表单
     */
    function initForm() {
      if (device.device_type == "1" || device.device_type == 1) {
        protocolOptions.value = [{label: "MQTT", value: "mqtt"}];
      } else {
        getGatewayProtocolList();
      }
      deviceData.dataExchangeAgreement = device.script_id ? device.script_id : "";
      deviceData.id = device.id;
      deviceData.protocol = device.protocol;
      deviceData.authMode = device.password ? "mqttBasic" : "accessToken";
      deviceData.token = device.token;
      deviceData.username = device.token;
      deviceData.password = device.password ? device.password : "";
      deviceData.errors = {};
      // 获取默认token和默认配置说明
      getDefaultSetting(device.protocol);
      initCustomExchangeAgreementList(device.protocol);

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
      deviceData.script_id = deviceData.dataExchangeAgreement;
      if (deviceData.authMode == "mqttBasic") {
        deviceData.token = deviceData.username;
      } else {
        deviceData.password = "";
      }
      updateDeviceInfo(deviceData)
        .then(({data}) => {
          if (data.code == 200) {
            message_success("更新成功！")
            context.emit("submit");
            onCancel();
          }
        })
    }

    /**
     * 传输协议更改
     * @param v
     */
    function handleChange(v){
      console.log("handleChange", v)
      getDefaultSetting(v);
      initCustomExchangeAgreementList(v);
    }

    /**
     * 获取网关传输协议下拉列表
     */
    function getGatewayProtocolList() {
      let param = { current_page: 1, per_page: 9999, dict_code: "GATEWAY_PROTOCOL"}
      DictAPI.list(param)
        .then(({data}) => {
          if (data.code == 200) {
            protocolOptions.value = data.data.data.map(item => {
              return {
                label: item.describe, value: item.dict_value
              }
            })
          }
        })
    }

    function handleAuthModeChange(v) {

    }


    /**
     * 获取token和配置说明
     */
    function getDefaultSetting(protocol) {
      if (!protocol) return;
      deviceData.defaultSetting = defaultSettings[protocol];
    }

    getDefaultSettings();
    function getDefaultSettings() {
      let protocols = ["mqtt", "MQTT", "MODBUS_TCP", "MODBUS_RTU"];
      defaultSettings = {};
      for (let p of protocols) {
        device_default_setting({ protocol: p})
            .then(({data}) => {
              if (data.code == 200) {
                console.log(data.data.default_setting)
                defaultSettings[p] = data.data.default_setting.split("$$").join("\n");
              }
            })
      }
    }

    let customExchangeAgreementVisible = ref(false);
    let oldCustomExchangeAgreement = "";
    let customExchangeAgreementList = ref([]);
    let exchangeAgreementData = reactive({
      id: "",
      protocol_type: ""
    })
    /**
     * 获取自定义数据交换列表
     */
    function initCustomExchangeAgreementList(v) {
      exchangeAgreementData.protocol_type = v;
      getCustomExchangeAgreementList({"current_page": 1, "per_page": 9999, "protocol_type": v})
      .then(({data}) => {
        if (data.code == 200) {
          if (data.data && data.data.data && data.data.data.length > 0) {
            customExchangeAgreementList.value = data.data.data.map(item => {
              return {value: item.id, label: item.script_name }
            });
          }
        }
      })
    }

    /**
     * 更改数据交换协议
     * @param v
     */
    function handleExchangeAgreementChange(v) {
      if (v != "custom") {
        oldCustomExchangeAgreement = v;
        return;
      }
      deviceData.dataExchangeAgreement = oldCustomExchangeAgreement;
      exchangeAgreementData.id = "";
      customExchangeAgreementVisible.value = true;
    }

    function handleAddExchangeAgreement(v) {
      console.log(v)
      initCustomExchangeAgreementList(device.protocol);
      oldCustomExchangeAgreement = deviceData.dataExchangeAgreement = v;
    }

    function handleShowExchangeAgreementDialog(v) {
      exchangeAgreementData.id = v.value;
      customExchangeAgreementVisible.value = true;
    }

    function handleDeleteExchangeAgreement(value) {
      message_confirm("是否删除此协议！")
        .then(() => {
          deleteCustomExchangeAgreement({id: value.value})
            .then(({data}) => {
              if (data.code == 200) {
                initCustomExchangeAgreementList(device.protocol);
                deviceData.dataExchangeAgreement = "";
              }
            })
        })
        .catch(() => {
          console.log("====cancel")
        })
    }


    return {
      formRule,
      protocolOptions,
      deviceData,
      onCancel,
      onSubmit,
      handleChange,
      handleAuthModeChange,
      handleExchangeAgreementChange,
      customExchangeAgreementVisible,
      customExchangeAgreementList,
      exchangeAgreementData,
      handleAddExchangeAgreement,
      handleShowExchangeAgreementDialog,
      handleDeleteExchangeAgreement
    }
  }
})
</script>

<style scoped lang="scss">
  ::v-deep .exchange-agreement {

    .el-select-dropdown__wrap {
      height: 100%!important;
      max-height: 500px;
    }
  }
</style>