<template>
  <div>
    <el-form :model="deviceData" label-width="120px">

      <el-form-item label="设备名:">
        <el-input size="medium" v-model="deviceData.name" :readonly="true"></el-input>
      </el-form-item>

      <el-form-item label="协议：">
        <el-select size="medium" placeholder="请选择协议" v-model="deviceData.protocol" @change="handleChange()">
          <el-option :label="'MQTT'" :value="'mqtt'"></el-option>
          <el-option :label="'TCP'" :value="'tcp'"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="默认配置:">
          <el-input type="textarea"
                    autosize :readonly="true"
                    v-model="default_setting">
          </el-input>
      </el-form-item>

      <div style="margin: 10px 0;"></div>

      <el-form-item label="Access Token:">
        <el-input size="medium" v-model="deviceData.token"></el-input>
      </el-form-item>

      <el-form-item label="接口类型:">
        <el-input size="medium" value="json" :readonly="true"></el-input>
      </el-form-item>
      <div style="margin: 10px 0;"></div>

        <div style="display: flex;justify-content: center">
          <el-button @click="onCancel">取消</el-button>
          <el-button type="primary" @click="onSubmit">保存</el-button>
        </div>

    </el-form>

  </div>
</template>

<script>
import {defineComponent, ref, reactive, watchEffect} from "@vue/composition-api";
import {device_default_setting} from "@/api/device";
import {device_info} from "../../../api/device";

export default defineComponent({
  name: "DeviceSettingForm",
  props: {
    device_item: {
      type: Object,
      default: () => {
        Object({protocol: "mqtt"})
      },
      required: true,
    }
  },
  emits: ['change', 'cancel'],
  setup(props, context){
    console.log(props.device_item)
    let deviceData = reactive({
      id: props.device_item.id,
      asset_id: props.device_item.asset_id,
      errors: props.device_item.errors,
      protocol: props.device_item.protocol,
      name: props.device_item.name,
      token: props.device_item.token
    })
    let default_setting = ref("");

    // 打开编辑对话框时获取默认token和默认配置说明
    getDefaultSetting();
    // getDeviceInfo();

    /**
     * 点击取消
     */
    function onCancel() {
      context.emit("cancel");
    }

    /**
     * 点击提交
     */
    function onSubmit() {
      context.emit('change', deviceData);
    }

    /**
     * 协议更改
     */
    function handleChange(){
      getDefaultSetting();
    }


    /**
     * 获取token和配置说明
     */
    function getDefaultSetting() {
      device_default_setting({protocol: deviceData.protocol})
        .then(({data}) => {
          if (data.code == 200) {
            if (data.data.Token && !props.device_item.token) {
              // 没有 token 时，使用默认值
              if (deviceData == "" || !deviceData.token || deviceData.token =="") {
                deviceData.token = data.data.Token
              }
            }
            if ( data && data.data && data.data.default_setting) {
              default_setting.value = data.data.default_setting.split("$$").join("\n")
            } else {
              default_setting.value = ""
            }
          }
        })
    }
    return {
      deviceData,
      default_setting,
      onCancel,
      onSubmit,
      handleChange,
    }
  }
})
</script>

<style scoped>

</style>