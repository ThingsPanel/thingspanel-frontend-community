<template>
<el-dialog :visible.sync="showDialog" :title="'设备详情'">
  <div>{{device_show}}</div>
</el-dialog>
</template>

<script>
import {computed, defineComponent, ref, watch} from "@vue/composition-api";
import {device_data} from "@/api/device";

export default defineComponent({
  name: "DeviceShowDialog",
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

    let device_show = ref({})

    // 设备id
    watch(()=>props.device_id, (id)=>{
      // id 改变的时候请求 设备详情
      device_data({id}).then(({data})=>{
        if(data.code===200){
          device_show.value = data.data
        }
      })
    })

    return {
      showDialog,
      device_show,
    }
  }
})
</script>

<style scoped>

</style>