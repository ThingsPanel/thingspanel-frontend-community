<template>
<el-select
    class="w-100"
    v-model="deviceGroupId"
    :clearable="clearable"
    :filterable="filterable"
    placeholder="请选择设备分组"
    size="medium" @change="handleChange()">
  <el-option
      :value="item.id"
      :label="item.device_group"
      v-for="item in deviceGroupOptions"></el-option>
</el-select>
</template>

<script>
import {defineComponent, ref, watch, computed} from "@vue/composition-api";
import {device_group_drop} from "@/api/asset";

export default defineComponent({
  name: "DeviceGroupSelector",
  props: {
    clearable: {
      default: true
    },
    filterable: {
      default: true
    },
    business_id: {
      required: true
    },
    asset_id: {
      required: true
    }
  },
  setup(props, context){
    let deviceGroupOptions = ref([])

    let deviceGroupId = computed({
      get(){
        return props.asset_id
      },
      set(val){
        context.emit("update:asset_id", val)
      }
    })

    // 获取选项
    watch(()=>props.business_id, ()=>{
      let business_id = props.business_id

      if(business_id){
        device_group_drop({business_id}).then(({data})=>{
          if(data.code === 200 && data.data) {
            deviceGroupOptions.value = data.data
          }
        })
      }
    }, {
      immediate: true
    })

    function handleChange(){
      context.emit("change")
    }


    return {
      deviceGroupId,
      deviceGroupOptions,
      handleChange,
    }
  }
})
</script>

<style scoped>

</style>