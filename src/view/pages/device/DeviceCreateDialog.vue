<template>
<el-dialog :visible.sync="showDialog" title="创建设备" width="30%">
  <div>创建</div>
</el-dialog>
</template>

<script>
import {defineComponent,computed} from "@vue/composition-api";

export default defineComponent({
  name: "DeviceCreateDialog",
  props: {
    asset_id: {
      required:true,
      type: String,
    },
    deviceCreateDialogVisible: {
      required: true,
      type: Boolean,
    }
  },
  setup(props, context){
    // 弹窗显示隐藏
    let showDialog = computed({
      get(){
        return !! props.deviceCreateDialogVisible;
      },
      set(val){
        context.emit('update:deviceCreateDialogVisible', val)
      }
    })

    return {
      showDialog
    }
  }
})
</script>

<style scoped>

</style>