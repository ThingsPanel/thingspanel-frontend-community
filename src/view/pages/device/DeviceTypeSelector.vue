<!-- 设备类型：网关/设备 -->
<template>
  <el-select
      class="w-100"
      size="medium"
      placeholder="请选择设备类型"
      v-model="deviceTypeId"
      :disabled="deviceType==3"
      filterable
      :clearable="clearable"
      @change="handleChange()"
  >
    <el-option v-for="item in options" :key="item.value" :value="item.value" :label="item.label"></el-option>
  </el-select>
</template>

<script>
import {computed, defineComponent} from "@vue/composition-api";

export default defineComponent({
  name: "DeviceTypeSelector",
  props: {
    clearable: {
      default: false,
      type: Boolean,
    },
    /**
     * 设备类型:  1 - 设备， 2 - 网关, 3 - 子设备
     */
    deviceType: {
      type: [String],
      default: "1"
    },
    options: {
      type: [Array],
      default: () => [
        {value: "1", label: "设备"},
        {value: "2", label: "网关"}
      ]
    }
  },
  emits:["change"],
  setup(props, context){

    let deviceTypeId = computed({
      get(){
        return props.deviceType == "3" ? "1" : props.deviceType;
      },
      set(val){
        context.emit("update:deviceType", val);
        context.emit("change", val)
      }
    })


    function handleChange(){
      // context.emit("change", value)
    }

    return {
      deviceTypeId,
      handleChange,
    }
  }
})
</script>

<style scoped>

</style>