<template>
<el-select
    class="w-100"
    v-model="deviceGroupId"
    :clearable="clearable"
    :filterable="filterable"
    :placeholder="$t('DATA_MANAGEMENT.PLACEHOLDER3')"
    :no-data-text="$t('PUBLIC.NODATA')"
    @change="handleChange()">
  <el-option
      :value="item.id"
      :label="item.device_group"
      v-for="item in deviceGroupOptions" :key="item.id"></el-option>
</el-select>
</template>

<script>
import {defineComponent, ref, watch, created, computed} from "@vue/composition-api";
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
    },
    showAll: {
      default: false
    }
  },
  setup(props, context){
    let deviceGroupOptions = ref([])

    /**
     * 展示所有设备分组选项
     */
    function initShowAll() {
      if(!props.showAll) return false
      deviceGroupOptions.value.unshift({
        device_group: '所有设备分组',
        id: 'all'
      })
    }


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
          if(deviceGroupOptions.value[0]?.id !== 'all') {
            initShowAll()
          }
        })
      }
    }, {
      immediate: true
    })

    function handleChange(){
      context.emit("change")
    }

    initShowAll()

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