<!-- 设备配置 -->
<template>
  <el-dialog class="el-dark-dialog el-dark-input" :title="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.DEVICECONFIG')" width="40%"
             :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false"
             :visible.sync="dialogVisible" @close="handleClose">
    <div class="container-fluid">
      <el-tabs v-model="activeName">
        <el-tab-pane v-for="item in tabList" :key="item.value" :label="item.label" :name="item.value"></el-tab-pane>
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
        <el-form label-position="left" :model="attrFormData">
          <el-form-item :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.SUBDEVICEADDRESS')" v-if="device.device_type =='3'">
            <el-input style="width: 100%" :placeholder="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.PLACEHOLDER1')" v-model="attrFormData.subDeviceAddress"></el-input>
          </el-form-item>

          <el-form-item v-if="device.device_type == '2' && device.protocol.startsWith('WVP_')" :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.LABLE1')">
            <el-select style="width: 100%" v-model="attrFormData.d_id">
              <el-option v-for="(item, index) in wvpDeviceList" :key="item.deviceId"
                         :label="item.deviceId + ' [' + item.createTime + '] ' + (item.online == 1 ? $t('DEVICE_MANAGEMENT.DEVICE_CONFIG.ONLINE') : $t('DEVICE_MANAGEMENT.DEVICE_CONFIG.OFFLINE'))"
                         :value="item.deviceId"
              ></el-option>
            </el-select>
          </el-form-item>

          <el-form-item :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.DEVICELOCATION')" >
            <el-input readonly @click.native="showCheckLocation" style="width: 100%" :placeholder="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.PLACEHOLDER2')"
                      v-model="attrFormData.location"
              ></el-input>
          </el-form-item>
        </el-form>
      </div>

      <!-- 运维信息 -->
      <div v-else-if="activeName=='runningStatus'">
        <el-form label-position="left" :model="runningFormData">
          <el-form-item :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.OFFLINETIME')" prop="thresholdTime">
            <el-input-number controls-position="right" size="small" v-model="runningFormData.thresholdTime" :min="5"></el-input-number>
            秒
          </el-form-item>
        </el-form>
      </div>
    </div>

    <span slot="footer" class="dialog-footer">
        <el-button type="cancel" @click="handleClose">{{ $t('DEVICE_MANAGEMENT.DEVICE_CONFIG.CANCEL') }}</el-button>
        <el-button type="save" @click="handleSubmit">{{ $t('DEVICE_MANAGEMENT.DEVICE_CONFIG.CONFIRM') }}</el-button>
      </span>

      <device-location-config v-if="positionShow" :maker-position.sync="locationArray" :dialog-visible.sync="positionShow"></device-location-config>
  </el-dialog>
  
</template>

<script>
import ModbusAPI from "@/api/modbus"
import ProtocolPluginAPI from "@/api/protocolPlugin"
import {message_success} from "../../../../../utils/helpers";
import DeviceLocationConfig from "@/components/common/DeviceLocationConfig.vue"
import i18n from "@/core/plugins/vue-i18n.js"
export default {
  name: "DeviceConfigForm",
  components: {
    DeviceLocationConfig
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
      positionShow: false,
      activeName: "",
      tabList: [
        { value: "configParse", label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.DATAANALYSIS')},
        { value: "deviceAttribute", label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.DEVICEPROPERTIES')},
        { value: "runningStatus", label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.OPERATION')}
      ],
      formAttr: [],
      formData: {},
      attrFormData: {},
      runningFormData: {
        thresholdTime: 60
      },
      formRule: {},
      location: "",
      locationArray: [],
      wvpDeviceList: []
    }
  },
  watch: {
    dialogVisible: {
      handler(newValue) {
        if (newValue) {
          console.log("====DeviceConfigForm.newValue", this.device)
          this.location = this.device.location ? this.device.location : "";
          let additionalInfo = (this.device.additional_info && this.device.additional_info!="null") ? JSON.parse(this.device.additional_info) :
              {runningInfo: {thresholdTime: 60}};

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
            this.tabList = [
              { value: "configParse", label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.DATAANALYSIS')},
              { value: "deviceAttribute", label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.DEVICEPROPERTIES')},
              { value: "runningStatus", label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.OPERATION')},
            ];
            this.activeName = "configParse";
            let deviceType = this.device.device_type == "1" ? "1" : "2";
            // 获取表单的属性
            ModbusAPI.getFormAttr({ protocol_type: this.device.protocol, device_type: deviceType})
                .then(({data}) => {
                  if (data.code == 200 && data.data && data.data.config) {
                    this.formAttr = data.data.config;
                    this.formRule = this.getFormRule(this.formAttr);
                    if (this.device.protocol_config != "{}"
                        && this.device.protocol_config != ""
                        && this.device.protocol_config != undefined) {
                      this.formData = JSON.parse(this.device.protocol_config);
                    }
                  } else {
                    this.tabList.splice(0, 1);
                    this.activeName = "deviceAttribute";
                  }
                })
          } else {
            this.tabList = [
              { value: "deviceAttribute", label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.DEVICEPROPERTIES')},
              { value: "runningStatus", label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.OPERATION')},
            ]
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
        }
      }
    },
    locationArray(newValue) {
      if(newValue) {
        this.attrFormData.location = newValue.join(",")
      }
    }
  },
  methods: {
    handleClose() {
      this.$emit("update:dialogVisible", false);
    },
    showCheckLocation() {
      this.positionShow = true
    },
    getWVPDeviceList() {
      ProtocolPluginAPI.getWVPDevices({
        "id": this.device.id,
        "count": "9999",
        "page":"1"
      })
        .then(({data}) => {
          console.log("====getWVPDeviceList", data)
          if (data.code == 200) {
            this.wvpDeviceList = data.data.list ? data.data.list : [];
          }
        })
    },
    handleSubmit() {
      console.log("====DeviceConfigForm", this.device.additional_info)
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
          subDeviceAddress: this.attrFormData.subDeviceAddress,
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