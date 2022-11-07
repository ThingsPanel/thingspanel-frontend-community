<template>
  <el-dialog
      class="el-dark-dialog el-dark-input" :append-to-body="true"
      :visible.sync="dialogVisible"
      title="编辑参数"
      :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false"
      width="800px">

    <el-form class="inline-edit el-dark-input" :model="deviceData" :rules="formRule" label-width="130px">

      <el-form-item label="传输协议：" prop="protocol">
        <el-select size="medium" placeholder="请选择协议" v-model="deviceData.protocol" @change="handleChange"
                   :disabled="deviceData.hasChildDevice">
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
        <el-descriptions class="el-dark-descriptions" :column="1" border :colon="true">
          <el-descriptions-item v-for="(item, index) in connectInfo" :key="index"
                                :contentStyle="getDescriptionContentStyle()"
                                :labelStyle="getDescriptionLabelStyle()"
                                :label="item.label">

            <el-link v-if="item.link" :href="item.value" target="_blank">{{item.value}}</el-link>

            <el-tooltip v-else effect="dark" :content="item.tooltip ? item.tooltip : '点击复制内容'" placement="right-start">
              <el-input ref="payloadInput" v-if="item.payload"  v-model="item.value" type="textarea"
                        v-clipboard:copy="item.value"
                        :autosize="{ maxRows: 6 }" readonly @focus="handleCopy(item)"
              >{{item.value}}</el-input>

              <el-input readonly v-else v-clipboard:copy="item.value" v-model="item.value" @click.native="handleCopy(item)">
              </el-input>
<!--              <span v-else v-clipboard:copy="item.value" @click="handleCopy(item)">{{item.value}}</span>-->
            </el-tooltip>
          </el-descriptions-item>
        </el-descriptions>
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
import {defineComponent, ref, reactive, watch, nextTick } from "@vue/composition-api";
import {device_default_setting} from "@/api/device";
import {getDeviceInfo, updateDeviceInfo} from "@/api/device";
import {message_success} from "@/utils/helpers";
import CustomExchangeAgreement from "./CustomExchangeAgreement";
import { getCustomExchangeAgreementList } from "@/api/device";
import {message_confirm} from "@/utils/helpers";
import DictAPI from "@/api/dict"
import PluginAPI from "@/api/plugin.js"
import {deleteCustomExchangeAgreement} from "@/api/device";
// 传输协议连接信息
import ProtocolInfo from "./protocol-info"

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
    let tslProperties = {};

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
              initForm(data.data);
            }
          })
    }

    // 传输协议下拉列表
    let protocolOptions = ref([]);
    // 表单数据
    let deviceData = reactive({
      protocol: "",
      hasChildDevice: false,
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
    async function initForm(d) {
      if (d.device_type == "1" || d.device_type == 1) {
        protocolOptions.value = [{label: "MQTT", value: "mqtt"}];
      } else {
        // 获取网关传输协议
        getGatewayProtocolList();
      }
      deviceData.dataExchangeAgreement = d.script_id ? d.script_id : "";
      deviceData.id = d.id;
      deviceData.hasChildDevice = !!device.children && device.children.length > 0
      deviceData.protocol = d.protocol;
      deviceData.authMode = d.password ? "mqttBasic" : "accessToken";
      deviceData.token = d.token;
      deviceData.username = d.token;
      deviceData.password = d.password ? d.password : "";
      deviceData.errors = {};
      deviceData.children = device.children;
      console.log("d", d)
      console.log("deviceData", deviceData)
      initCustomExchangeAgreementList(d.protocol);

      if (d.device_type == "2") {
        // 获取网关的所有子设备绑定的插件模型
        if (deviceData.hasChildDevice && deviceData.protocol == "MQTT") {
          for (let child of deviceData.children) {
            tslProperties[child.subDeviceAddress] = await getTSLByPluginId(child.type);
          }
        }
      } else {
        // 获取设备绑定的插件的物模型
        tslProperties["single"] = await getTSLByPluginId(d.type)
      }

      // 获取默认token和默认配置说明, 必须在getTSLByPluginId之后执行
      getDefaultSetting(d.protocol);
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


    let connectInfo = ref([]);
    /**
     * 获取token和配置说明
     */
    function getDefaultSetting(protocol) {
      console.log("getDefaultSetting", deviceData)
      if (!protocol) return;
      let defaultSetting = JSON.parse(JSON.stringify(ProtocolInfo[protocol]));
      let payload = getPayload();

      defaultSetting.forEach(item => {
        item.value = item.value.replaceAll("{AccessToken}", device.token);
        item.value = item.value.replaceAll("{payload}", payload);
      })
      connectInfo.value = defaultSetting;
    }

    /**
     * 获取推送报文
     */
    function getPayload() {
      let payload = {};

      if (tslProperties.single) {
        // 获取标准设备的推送格式
        tslProperties.single.forEach(item => {
          payload[item.name] = item.title + "值";
        })


      } else {
        // 获取网关的推送格式   {sub_device_addr:{key:value...},sub_device_addr:{key:value...}...}
        console.log("tslProperties", tslProperties)
        for (let subAddr in tslProperties) {
          let tslList = tslProperties[subAddr];
          // 遍历物模型
          let subTsl = {};
          tslList.forEach(item => {
            console.log("tslList", item)
            subTsl[item.name] = item.title + "值";
          })
          if (subAddr) {
            payload[subAddr] = subTsl;
          }
        }
      }

      let payloadStr = JSON.stringify(payload, null, 4);
      return payloadStr;
    }

    /**
     * 获取单个设备的推送报文
     * @param d
     * @returns {Promise<void>}
     */
    function getSingleDevicePayload(d) {

    }

    /**
     * 通过插件id获取物模型
     * @param pluginId
     */
    async function getTSLByPluginId(pluginId) {
      let param = {"current_page": 1, "per_page": 10, "id": pluginId}
      let {data} = await PluginAPI.page(param)
      if (data.code == 200) {
        if (!data.data.data || data.data.data.length == 0) return []
        let pluginStr = data.data.data[0].chart_data;
        if (pluginStr == "" || pluginStr == "{}" || pluginStr == undefined) return []
        let plugin = JSON.parse(pluginStr);
        return plugin.tsl.properties;
      }
      return [];
    }

    function handleCopy(item) {
      let index = connectInfo.value.findIndex(it => it == item )
      connectInfo.value.forEach(it => {
        delete it.tooltip;
      })
      let info = connectInfo.value[index];
      info.tooltip = "内容已复制";
      connectInfo.value.splice(index, 1, info);


      // item.tooltip = true;
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

    // 连接信息内容样式
    function getDescriptionContentStyle() {
      return {color: '#fff', backgroundColor: '#2d3d88!important'}
    }

    // 连接信息标签样式
    function getDescriptionLabelStyle() {
      return {width: '160px', fontSize: '11px!important', color: '#ccc!important', backgroundColor: '#2d3d88!important'};
    }


    return {
      formRule,
      protocolOptions,
      deviceData,
      connectInfo,
      handleCopy,
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
      handleDeleteExchangeAgreement,
      getDescriptionContentStyle,
      getDescriptionLabelStyle
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