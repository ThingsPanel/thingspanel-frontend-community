<template>
<el-dialog :visible.sync="showDialog" :title="'设备详情'" width="30%">
  <DeviceEditForm :device_id="device_id" v-on="$listeners"></DeviceEditForm>
</el-dialog>
</template>

<script>
import {computed, defineComponent} from "@vue/composition-api";
import DeviceEditForm from "@/view/pages/device/DeviceEditForm";

export default defineComponent({
  name: "DeviceShowDialog",
  components: {
    DeviceEditForm
  },
  props:{
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