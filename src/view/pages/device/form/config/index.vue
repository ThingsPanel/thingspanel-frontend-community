<!-- 设备配置 -->
<template>
  <el-dialog class="el-dark-dialog el-dark-input" :title="device.name + ' - ' + $t('DEVICE_MANAGEMENT.DEVICE_DETAIL')" width="60%"
             :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false" :append-to-body="true"
             :visible.sync="dialogVisible" @close="handleClose">
    <div class="container-fluid">
      <el-tabs v-model="activeName">
        <el-tab-pane v-for="item in tabList" :key="item.value" :label="item.label" :name="item.value"></el-tab-pane>
      </el-tabs>

      <!-- 设备概览 -->
      <device-attribute v-if="activeName=='deviceAttribute'" :data.sync="attrFormData" :initAttributeCard.sync="initAttributeCard" :device="device" :wvpDevice="wvpDeviceList"></device-attribute>

      <!-- 数据解析 -->
      <data-parse ref="dataParse" v-else-if="activeName=='configParse'" :data.sync="formData" :attrs="formAttr"></data-parse>

      <!-- 设备属性 -->
      <attribute v-else-if="activeName=='attribute'" :data.sync="attrFormData" :device="device" :wvpDevice="wvpDeviceList"></attribute>

      <!-- 运维信息 -->
      <running-info v-else-if="activeName=='runningStatus'" :data.sync="runningFormData" :device="device" ></running-info>

      <!-- 事件 -->
      <event v-else-if="activeName=='event'" :data.sync="eventFormData" :device="device"></event>

      <!-- 命令 -->
      <command v-else-if="activeName=='command'" :data.sync="commandFormData" :device="device"></command>
      
      <!-- 设备插件 -->
      <device-plugin v-else-if="activeName=='devicePlugin'" :data.sync="attrFormData" :device="device"></device-plugin>
      
      <!-- 设备日志 -->
      <device-log v-else-if="activeName=='deviceLog'" :data.sync="attrFormData" :device="device"></device-log>
      
    </div>

    <span slot="footer" class="dialog-footer">
        <el-button type="cancel" @click="handleClose">{{ $t('DEVICE_MANAGEMENT.DEVICE_CONFIG.CANCEL') }}</el-button>
        <el-button type="save" @click="handleSubmit">{{ $t('DEVICE_MANAGEMENT.DEVICE_CONFIG.CONFIRM') }}</el-button>
      </span>

  </el-dialog>
  
</template>

<script>
import ModbusAPI from "@/api/modbus"
import ProtocolPluginAPI from "@/api/protocolPlugin"
import {message_success} from "@/utils/helpers";
import DataParse from "./DataParse.vue"
import DeviceAttribute from './DeviceAttribute'
import DevicePlugin from './DevicePlugin'
import DeviceLog from './DeviceLog'
import RunningInfo from "./RunningInfo.vue"
import Event from "./Event.vue"
import Command from "./Command.vue"
import Attribute from "./attribute.vue"
import i18n from "@/core/plugins/vue-i18n.js"
const tabList = [
        { value: "deviceAttribute", label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.OVERVIEW')},
        { value: "configParse", label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.DATAANALYSIS')},
        { value: "attribute", label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.PROPERTIES_REPORT') },
        { value: "runningStatus", label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.OPERATION')},
        { value: "event", label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.EVENT_REPORT') },
        { value: "command", label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.COMMAND_DELIVERY')},
        { value: "devicePlugin", label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.DEVICE_PLUGIN')},
        { value: "deviceLog", label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.DEVICE_LOG')},
      ]
export default {
  name: "DeviceDetail",
  components: {
    DataParse,
    DeviceAttribute,
    DevicePlugin,
    DeviceLog,
    Attribute,
    RunningInfo,
    Event,
    Command
  },
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
      tabList: [],
      formAttr: [],
      formData: {},
      attrFormData: {},
      runningFormData: {
        thresholdTime: 0
      },
      formRule: {},
      location: "",
      wvpDeviceList: [],
      eventFormData: {},
      commandFormData: {},
      // 是否需要刷新属性卡片，监听打开对话框和tab切换，向子组件发送更新命令
      initAttributeCard: true,
    }
  },
  watch: {
    activeName: {
      handler(newValue){
        this.initAttributeCard = newValue === "deviceAttribute" 
      }
    },
    dialogVisible: {
      handler(newValue) {
        if (newValue === false) {
          this.initAttributeCard = false
        }
        if (newValue) {
          console.log("====DeviceConfigForm.newValue", this.device)
          this.location = this.device.location ? this.device.location : "";
          let additionalInfo = (this.device.additional_info && this.device.additional_info!="null") ? JSON.parse(this.device.additional_info) :
              {runningInfo: {thresholdTime: 0}};

          this.attrFormData = {
            d_id: this.device.d_id,
            subDeviceAddress: this.device.subDeviceAddress,
            location: this.device.location,
            subDeviceVideoAddress: additionalInfo.video_address
          };

          this.runningFormData = additionalInfo.runningInfo ? additionalInfo.runningInfo : {};
          this.formData = {};
          if (JSON.stringify(this.device) == "{}" || this.device == "") {return;}
          if (this.device.device_type == "3" || (this.device.device_type == "1" && this.device.protocol != "mqtt")) {
            // 子设备所有协议都要数据解析，直连设备所有自定义协议(mqtt协议之外)都要数据解析
            this.tabList = JSON.parse(JSON.stringify(tabList));
            this.activeName = "deviceAttribute";
            let deviceType = this.device.device_type == "1" ? "1" : "2";
            // 获取表单的属性
            ModbusAPI.getFormAttr({ protocol_type: this.device.protocol, device_type: deviceType})
                .then(({data}) => {
                  if (data.code == 200 && data.data && data.data.config) {
                    this.formAttr = data.data.config;
                    if (this.device.protocol_config != "{}"
                        && this.device.protocol_config != ""
                        && this.device.protocol_config != undefined) {
                      this.formData = JSON.parse(this.device.protocol_config);
                    }
                  } else {
                    this.tabList = this.tabList.filter(item => item.value !== "configParse")
                    this.activeName = "deviceAttribute";
                  }
                })
          } else {
            this.tabList = JSON.parse(JSON.stringify(tabList));
            // const configParseIndex = this.tabList.findIndex(item => item.value === "configParse");
            this.tabList = this.tabList.filter(item => item.value !== "configParse")
            this.activeName = "deviceAttribute";
            this.formRule = {
              location: [
                { required: false, message: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.PLACEHOLDER3'), trigger: 'change' }
              ],
            };
            if (this.device.device_type == 2 && this.device.protocol.startsWith("WVP_")) {
              // 是网关且协议为GB28181
              this.getWVPDeviceList();
            }
          }

          this.initAttributeCard = this.activeName === "deviceAttribute" 
        }
      }
    }
  },
  methods: {
    handleClose() {
      this.$emit("update:dialogVisible", false);
    },
    getWVPDeviceList() {
      ProtocolPluginAPI.getWVPDevices({"id": this.device.id,"count": "9999","page":"1"})
        .then(({data}) => {
          console.log("====getWVPDeviceList", data)
          if (data.code == 200) {
            this.wvpDeviceList = data.data.list ? data.data.list : [];
          }
        })
    },
    handleSubmit() {
      console.log("====DeviceConfigForm", this.formData)

      const submit = () => {
        let device = this.device;
        let additionalInfo = (this.device.additional_info && this.device.additional_info!="null") ? JSON.parse(this.device.additional_info) : {};
        additionalInfo.runningInfo = this.runningFormData;
        additionalInfo.video_address = this.attrFormData.subDeviceVideoAddress;
        let config = {
          id: device.id,
          d_id: this.attrFormData.d_id,
          additional_info: JSON.stringify(additionalInfo),
          location: this.attrFormData.location,
          sub_device_addr: this.attrFormData.subDeviceAddress,
          protocol_config: JSON.stringify({DeviceId: device.id, AccessToken: device.token, ...this.formData})
        }
        console.log("====DeviceConfigForm.config", config, this.attrFormData)

        ModbusAPI.updateDeviceConfig(config)
            .then(({data}) => {
              if (data.code == 200) {
                message_success("配置成功！");
                this.handleClose();
                this.$emit("submit");
              }
            })
      }
      if (this.$refs["dataParse"]) {
        this.$refs["dataParse"].validate((valid) => {
          console.log('====DeviceConfigForm.valid', valid);
          if (valid) {
            submit();
          }
        });
      } else {
        submit();
      }
    }
  }
}
</script>

<style scoped>

</style>