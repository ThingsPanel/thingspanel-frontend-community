<template>
  <el-dialog
      class="el-dark-dialog el-dark-input"
      :visible.sync="dialogVisible"
      :title="$t('DEVICE_MANAGEMENT.CONFIG_PARAMETER.CONFIGPARAMETER')"
      :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false"
      width="600px">
    <el-form label-width="120px" >
        <el-form-item :label="device_item.protocol && device_item.protocol.startsWith('WVP_') ? $t('DEVICE_MANAGEMENT.CONFIG_PARAMETER.CHANGENUMBER') : $t('DEVICE_MANAGEMENT.CONFIG_PARAMETER.DEVICEADDRESS')" style="padding: 30px">
          <el-input size="medium" v-model="subDeviceAddress" ></el-input>
        </el-form-item>
        <el-form-item v-if="device_item.protocol && device_item.protocol.startsWith('WVP_')" :label="$t('DEVICE_MANAGEMENT.CONFIG_PARAMETER.PLAYBACKADDRESS')" style="padding: 30px">
          <el-input size="medium" v-model="subDeviceVideoAddress" ></el-input>
        </el-form-item>

      <div style="display: flex;justify-content: center;margin-bottom:30px">
        <el-button @click="closeDialog">{{ $t('DEVICE_MANAGEMENT.CONFIG_PARAMETER.CANCEL') }}</el-button>
        <el-button type="primary" @click="onSubmit">{{ $t('DEVICE_MANAGEMENT.CONFIG_PARAMETER.SAVE') }}</el-button>
      </div>
    </el-form>

  </el-dialog>
</template>

<script>
import { ref, watch, defineComponent } from "@vue/composition-api";

import { getDeviceInfo, updateDeviceInfo } from "@/api/device";
import {message_success} from "@/utils/helpers";

export default defineComponent({
  name: "SubDeviceSettingForm",
  props: {
    dialogVisible: {
      type: [Boolean],
      default: false
    },
    device_item: {
      type: [Object]
    }
  },
  setup(props, context){
    let subDeviceAddress = ref("")
    let subDeviceVideoAddress = ref("")
    let additionalInfo = {};

    let device = {};

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
     * 关闭对话框
     */
    function closeDialog() {
      context.emit("update:dialogVisible", false);
    }

    /**
     * 提交
     */
    function onSubmit() {
      let params = {};
      params.id = device.id;
      params.sub_device_addr = subDeviceAddress.value;
      additionalInfo.video_address = subDeviceVideoAddress.value;
      params.additional_info = JSON.stringify(additionalInfo);
      updateDeviceInfo(params)
        .then(({data}) => {
          if (data.code == 200) {
            message_success("修改成功！");
            closeDialog();
          }
        })
    }

    /**
     * 获取设备信息
     */
    function getDeviceInformation() {
      getDeviceInfo({ id: device.id })
        .then(({data}) => {
          if (data.code == 200) {
            console.log("====getDeviceInformation", data)
            subDeviceAddress.value = data.data.sub_device_addr ? data.data.sub_device_addr : "";
            additionalInfo = data.data.additional_info ? JSON.parse(data.data.additional_info) : {};
            subDeviceVideoAddress.value = additionalInfo.video_address ? additionalInfo.video_address : "";
          }
        })
    }


    return {
      subDeviceAddress,
      subDeviceVideoAddress,
      closeDialog,
      onSubmit
    }
  }
})
</script>

<style scoped>

</style>