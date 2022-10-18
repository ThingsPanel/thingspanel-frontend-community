<template>
  <el-dialog
      class="el-dark-dialog el-dark-input"
      :visible.sync="dialogVisible"
      title="配置参数"
      :close-on-click-modal="false"
      width="600px">
    <el-form label-width="120px" >
      <el-form-item label="设备地址:" style="padding: 50px">
        <el-input size="medium" v-model="subDeviceAddress" ></el-input>
      </el-form-item>

      <div style="display: flex;justify-content: center;margin-bottom:30px">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="onSubmit">保存</el-button>
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
      updateDeviceInfo({id: device.id, sub_device_addr: subDeviceAddress.value})
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
            subDeviceAddress.value = data.data.sub_device_addr ? data.data.sub_device_addr : "";
          }
        })
    }


    return {
      subDeviceAddress,
      closeDialog,
      onSubmit
    }
  }
})
</script>

<style scoped>

</style>