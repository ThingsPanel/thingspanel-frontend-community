<!-- 编辑参数 -->
<template>
  <el-dialog
      class="el-dark-dialog el-dark-input" :append-to-body="true"
      :visible.sync="dialogVisible"
      :title="$t('DEVICE_MANAGEMENT.EDIT_PARAMETER.EDITPARAMETER')"
      :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false"
      width="820px">

    <el-form ref="settingFormRef" class="inline-edit el-dark-input" :model="deviceData" :rules="formRule" label-width="180px">

      <el-form-item :label="$t('DEVICE_MANAGEMENT.EDIT_PARAMETER.LABLE1')" prop="protocol">
        <el-select size="medium" :placeholder="$t('DEVICE_MANAGEMENT.EDIT_PARAMETER.PLACEHOLDER1')" v-model="deviceData.protocol" @change="handleChange"
                   :disabled="deviceData.hasChildDevice">
          <el-option v-for="option in protocolOptions" :key="option.id" :label="option.label" :value="option.value"></el-option>
        </el-select>
      </el-form-item>

      <!-- 视频地址接入 -->
      <div v-if="deviceData.protocol == 'video_address'" style="margin-top: 10px;margin-bottom: 20px" >
        <el-form-item :label="$t('DEVICE_MANAGEMENT.EDIT_PARAMETER.LABLE2')">
          <el-input style="width: 100%;margin-right: 20px" size="medium" :placeholder="$t('DEVICE_MANAGEMENT.EDIT_PARAMETER.PLACEHOLDER2')" v-model="deviceData.video_address"></el-input>
        </el-form-item>
      </div>

      <!-- 萤石云接入 -->
      <div v-else-if="deviceData.protocol == 'ezviz'" style="margin-top: 10px;margin-bottom: 20px" >
        <el-form-item :label="$t('DEVICE_MANAGEMENT.EDIT_PARAMETER.LABLE2')">
          <el-input style="width: 100%;margin-right: 20px" size="medium" :placeholder="$t('DEVICE_MANAGEMENT.EDIT_PARAMETER.PLACEHOLDER2')" v-model="deviceData.video_address"></el-input>
        </el-form-item>

        <el-form-item label="AppKey：">
          <el-input style="width: 100%;margin-right: 20px" size="medium" placeholder="请输入AppKey" type="password"
            v-model="deviceData.app_key"></el-input>
        </el-form-item>

        <el-form-item label="Secret：">
          <el-input style="width: 100%;margin-right: 20px" size="medium" placeholder="请输入Secret" type="password"
            v-model="deviceData.secret"></el-input>
        </el-form-item>
      </div>


      <div v-else>
        <!-- 视频设备id-->
<!--        <div v-if="deviceData.protocol.startsWith('WVP_')" style="margin-top: 10px;margin-bottom: 20px" >-->
<!--          <el-form-item :label="$t('DEVICE_MANAGEMENT.EDIT_PARAMETER.LABLE8') prop="d_id">-->
<!--            <el-input style="width: 100%;margin-right: 20px" size="medium" :placeholder="$t('DEVICE_MANAGEMENT.EDIT_PARAMETER.PLACEHOLDER8')" v-model="deviceData.d_id"></el-input>-->
<!--          </el-form-item>-->
<!--        </div>-->
        <div v-if="deviceData.protocol.startsWith('WVP_')" style="margin-top: 10px;margin-bottom: 20px">
          <el-form-item :label="$t('DEVICE_MANAGEMENT.EDIT_PARAMETER.LABLE3')" prop="authMode">
            <el-select size="medium" :placeholder="$t('DEVICE_MANAGEMENT.EDIT_PARAMETER.PLACEHOLDER3')" :disabled="true" v-model="deviceData.authMode"
                       @change="handleAuthModeChange">
              <el-option :label="$t('DEVICE_MANAGEMENT.EDIT_PARAMETER.OPTIONLABLE1')" :value="'accessToken'"></el-option>
            </el-select>
          </el-form-item>

        </div>


        <div v-else>
          <el-form-item :label="$t('DEVICE_MANAGEMENT.EDIT_PARAMETER.LABLE3')" prop="authMode">
            <el-select size="medium" :placeholder="$t('DEVICE_MANAGEMENT.EDIT_PARAMETER.PLACEHOLDER3')" v-model="deviceData.authMode"
                       @change="handleAuthModeChange">
              <el-option :label="'AccessToken接入'" :value="'accessToken'"></el-option>
              <el-option :label="'Basic'" :value="'mqttBasic'"></el-option>
              <el-option :disabled="true" :label="'X.509'" :value="'x509'"></el-option>
            </el-select>
          </el-form-item>

          <el-form-item v-if="deviceData.authMode=='accessToken'" label="Access Token：" prop="token">
            <el-input size="medium" v-model="deviceData.token"></el-input>
          </el-form-item>

          <el-form-item v-if="deviceData.authMode=='mqttBasic'" :label="$t('DEVICE_MANAGEMENT.EDIT_PARAMETER.LABLE4')" prop="username">
            <el-input size="medium" v-model="deviceData.username"></el-input>
          </el-form-item>

          <el-form-item v-if="deviceData.authMode=='mqttBasic'" :label="$t('DEVICE_MANAGEMENT.EDIT_PARAMETER.LABLE5')" prop="password">
            <el-input size="medium" v-model="deviceData.password"></el-input>
          </el-form-item>
        </div>


        <el-form-item :label="$t('DEVICE_MANAGEMENT.EDIT_PARAMETER.LABLE6')">
          <el-descriptions class="el-dark-descriptions" :column="1" border :colon="true">
            <el-descriptions-item v-for="(item, index) in connectInfo" :key="index"
                                  :contentStyle="getDescriptionContentStyle()"
                                  :labelStyle="getDescriptionLabelStyle()"
                                  :label="item.label">

              <el-link v-if="item.link" :href="item.value" target="_blank">{{item.value}}</el-link>

              <el-tooltip v-else effect="dark" :content="item.tooltip ? item.tooltip : $t('DEVICE_MANAGEMENT.EDIT_PARAMETER.COPY')" placement="right-start">
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

        <el-form-item v-if="!deviceData.protocol.startsWith('WVP_')" :label="$t('DEVICE_MANAGEMENT.EDIT_PARAMETER.LABLE7')">
          <el-select size="medium" placeholder="" filterable
                     popper-class="exchange-agreement" :popper-append-to-body="false"
                     v-model="deviceData.dataExchangeAgreement"
                     @change="handleExchangeAgreementChange">
            <el-option-group >
              <el-option :label="$t('DEVICE_MANAGEMENT.EDIT_PARAMETER.OPTIONLABLE2')" :value="''"></el-option>
              <el-option :label="$t('DEVICE_MANAGEMENT.EDIT_PARAMETER.OPTIONLABLE3')" :value="'custom'"></el-option>
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

      </div>

        <div style="display: flex;justify-content: center">
          <el-button type="cancel" @click="onCancel">{{ $t('DEVICE_MANAGEMENT.EDIT_PARAMETER.CANCEL') }}</el-button>
          <el-button type="save" @click="onSubmit">{{ $t('DEVICE_MANAGEMENT.EDIT_PARAMETER.SAVE') }}</el-button>
        </div>

    </el-form>

    <!--    数据交换格式-->
    <custom-exchange-agreement :dialog-visible.sync="customExchangeAgreementVisible" :connect-info="connectInfo"
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
import useDeviceSettingIndex from "./useDeviceSettingIndex";
import i18n from "@/core/plugins/vue-i18n.js"
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
    let { getDeviceProtocolList, getGatewayProtocolList, getCustomConnectInformation } = useDeviceSettingIndex()

    const required = true;
    let formRule = ref({
      protocol: [ {required, message: i18n.t('DEVICE_MANAGEMENT.EDIT_PARAMETER.PLACEHOLDER5')}],
      token: [ {required, message: i18n.t('DEVICE_MANAGEMENT.EDIT_PARAMETER.PLACEHOLDER6')}],
      username: [ {required, message: i18n.t('DEVICE_MANAGEMENT.EDIT_PARAMETER.PLACEHOLDER7')}],
      password: [ {required, message: i18n.t('DEVICE_MANAGEMENT.EDIT_PARAMETER.PLACEHOLDER8')}],
      d_id: [ {required, message: i18n.t('DEVICE_MANAGEMENT.EDIT_PARAMETER.PLACEHOLDER9')}],
      dataExchangeAgreement: [ {required, message: i18n.t('DEVICE_MANAGEMENT.EDIT_PARAMETER.PLACEHOLDER10')}]
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
      video_address: "",
      app_key: "",
      secret: "",
      token: "",
      d_id: "",
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
        // 标准单设备
        protocolOptions.value = await getDeviceProtocolList();
      } else {
        // 网关
        // 获取网关传输协议
        protocolOptions.value = await getGatewayProtocolList();
      }
      deviceData.dataExchangeAgreement = d.script_id ? d.script_id : "";
      deviceData.id = d.id;
      deviceData.hasChildDevice = !!device.children && device.children.length > 0
      deviceData.device_type = d.device_type;
      deviceData.d_id = d.d_id;
      deviceData.protocol = d.protocol;
      deviceData.authMode = d.password ? "mqttBasic" : "accessToken";
      deviceData.token = d.token;
      deviceData.username = d.token;
      deviceData.password = d.password ? d.password : "";
      deviceData.errors = {};
      deviceData.children = device.children;
      deviceData.video_address = d.additional_info ? JSON.parse(d.additional_info).video_address : "";
      deviceData.app_key = d.additional_info ? JSON.parse(d.additional_info).app_key : "";
      deviceData.secret = d.additional_info ? JSON.parse(d.additional_info).secret : "";
      deviceData.additionalInfo = d.additional_info ? JSON.parse(d.additional_info) : {};
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
      await getDefaultSetting(d.protocol);
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
      this.$refs.settingFormRef.validate(valid => {
        if (valid) {
          if (deviceData.protocol == "video_address") {
            deviceData.additionalInfo.video_address = deviceData.video_address;
            deviceData.additional_info = JSON.stringify(deviceData.additionalInfo);
          } else if (deviceData.protocol == "ezviz") {
            deviceData.additionalInfo.video_address = deviceData.video_address;
            deviceData.additionalInfo.app_key = deviceData.app_key;
            deviceData.additionalInfo.secret = deviceData.secret;
            deviceData.additional_info = JSON.stringify(deviceData.additionalInfo);
          } else {
            deviceData.script_id = deviceData.dataExchangeAgreement;
            if (deviceData.authMode == "mqttBasic") {
              deviceData.token = deviceData.username;
            } else {
              deviceData.password = "";
            }
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
      })
    }

    /**
     * 传输协议更改
     * @param v
     */
    function handleChange(v){
      getDefaultSetting(v);
      initCustomExchangeAgreementList(v);
    }


    function handleAuthModeChange(v) {
      getDefaultSetting(deviceData.protocol);

    }

    // 连接信息
    let connectInfo = ref([]);
    /**
     * 获取token和配置说明
     */
    async function getDefaultSetting(protocol) {
      const setConnectSetting = () => {
        let defaultSetting = JSON.parse(JSON.stringify(ProtocolInfo[protocol]));
        let payload = getPayload();

        let settings = [];
        defaultSetting.forEach(item => {
          item.value = item.value.replaceAll("{AccessToken}", device.token);
          item.value = item.value.replaceAll("{payload}", payload);
          if (item.show && item.show.indexOf(deviceData.authMode) > -1) {
            settings.push(item);
          } else if (!item.show) {
            settings.push(item);
          }
        })
        connectInfo.value = settings;
      };

      if (!protocol) return;
      if (deviceData.device_type === "1") {
        // 直接设备
        if (deviceData.protocol === "mqtt") {
          setConnectSetting();
        } else if (deviceData.protocol !== "mqtt" && deviceData.protocol !== "video_address") {
          // 自定义协议
          connectInfo.value = await getCustomConnectInformation(deviceData);
        }
      } else if (deviceData.device_type === "2") {
        // 网关
        if (deviceData.protocol === "MQTT") {
          setConnectSetting();
        } else {
          // 自定义协议
          connectInfo.value = await getCustomConnectInformation(deviceData);
        }
      }

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
        for (let subAddr in tslProperties) {
          let tslList = tslProperties[subAddr];
          // 遍历物模型
          let subTsl = {};
          tslList.forEach(item => {
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
      info.tooltip = this.$t('DEVICE_MANAGEMENT.EDIT_PARAMETER.COPIED');
      connectInfo.value.splice(index, 1, info);

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
      let params = {"current_page": 1, "per_page": 9999, "protocol_type": v, "device_type": deviceData.device_type};
      getCustomExchangeAgreementList(params)
      .then(({data}) => {
        if (data.code == 200) {
          if (data.data && data.data.data && data.data.data.length > 0) {
            customExchangeAgreementList.value = data.data.data.map(item => {
              return {value: item.id, label: item.script_name }
            });
          } else {
            customExchangeAgreementList.value = [];
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
      message_success("保存成功！");
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