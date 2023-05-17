<!-- 设备分组下拉列表 -->
<template>
  <el-select
      class="w-100"
      size="medium"
      :placeholder="$t('DEVICE_MANAGEMENT.PLACEHOLDER1')"
      :no-data-text="$t('PUBLIC.NODATA')"
      v-model="device_group_id"
      :disabled="disabled"
      filterable
      autocomplete="off"
      :clearable="clearable"
      @change="handleChange()"
  >
    <el-option
        v-for="item in options"
        :key="item.id"
        :value="item.id"
        :label="item.device_group"
    ></el-option>
  </el-select>
</template>

<script>
import {computed, defineComponent} from "@vue/composition-api";

export default defineComponent({
  name: "DeviceGroupSelector",
  props: {
    disabled: {
      default: false,
      type: Boolean,
    },
    clearable: {
      default: false,
      type: Boolean,
    },
    asset_id: {
      required: true,
      type: String,
    },
    options: {
      required: true,
      type: Array,
    }
  },
  emits:["change"],
  setup(props, context){

    let device_group_id = computed({
      get(){
        return props.asset_id
      },
      set(val){
        context.emit("update:asset_id", val)
      }
    })


    function handleChange(){
      context.emit("change")
    }

    return {
      device_group_id,
      handleChange,
    }
  }
})
</script>

<style scoped>

</style>