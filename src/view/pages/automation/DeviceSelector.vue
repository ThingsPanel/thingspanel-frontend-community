<template>
<el-select
    class="w-100"
    v-model="deviceId"
    :clearable="clearable"
    :filterable="filterable"
    :placeholder="$t('AUTOMATION.PLACEHOLDER1')"
    size="medium"
    @change="handleChange"
>
  <el-option
      :value="item.id"
      :label="item.name"
      v-for="item in deviceOptions"></el-option>

</el-select>
</template>

<script>
import {computed, defineComponent, ref, watch} from "@vue/composition-api";
import {dashboard_device} from "@/api/automation";

export default defineComponent({
  name: "DeviceSelector",
  props: {
    clearable:{
      default: true,
    },
    filterable:{
      default: true
    },
    asset_id: {
      required: true
    },
    device_id: {
      required: true
    }
  },
  setup(props, context){
    let deviceOptions = ref([])

    let deviceId = computed({
      get(){
        return props.device_id
      },
      set(val){
        context.emit("update:device_id", val)
      }
    })

    // 获取选项
    watch(()=>props.asset_id, ()=>{
      let asset_id = props.asset_id

      if(asset_id){
        dashboard_device({asset_id}).then(({data})=>{
          if(data.code === 200 && data.data){
            deviceOptions.value = data.data
          }
        })
      }
    }, {
      immediate: true
    })

    function handleChange(val){
      context.emit("change", val)
    }

    return {
      deviceId,
      deviceOptions,
      handleChange,
    }
  }
})
</script>

<style scoped>

</style>