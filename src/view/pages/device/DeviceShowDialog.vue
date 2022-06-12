<template>
<el-dialog :visible.sync="showDialog" :title="'设备详情'" width="30%">
  <!-- 有设备id时修改 没有时创建 -->
  <DeviceEditForm v-if="device_id" :device_id="device_id" v-on="$listeners"></DeviceEditForm>
  <DeviceCreateForm v-else :asset_id="asset_id" v-on="$listeners"></DeviceCreateForm>
</el-dialog>
</template>

<script>
import {computed, defineComponent} from "@vue/composition-api";
import DeviceEditForm from "@/view/pages/device/DeviceEditForm";
import DeviceCreateForm from "@/view/pages/device/DeviceCreateForm";

export default defineComponent({
  name: "DeviceShowDialog",
  components: {
    DeviceEditForm,
    DeviceCreateForm,
  },
  props:{
    asset_id: {
      required: true,
      type: String,
    },
    device_id: {
      required: true,
      type: String,
    },
    deviceShowDialogVisible: {
      required: true,
      type: Boolean,
    }
  },
  setup(props, context){
    // 弹窗显示隐藏
    let showDialog = computed({
      get(){
        return !! props.deviceShowDialogVisible;
      },
      set(val){
        context.emit('update:deviceShowDialogVisible', val)
      }
    })

    return {
      showDialog,
    }
  }
})
</script>

<style scoped>

</style>