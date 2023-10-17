<template>
  <el-select ref="selectRef"
      class="w-100"
      size="medium"
      :placeholder="$t('DEVICE_MANAGEMENT.PLACEHOLDER4')"
      v-model="deviceTypeId"
      :disabled="deviceType==3 || !!currentItem.children"
      filterable
      :clearable="clearable"
      @change="handleChange"
  >
    <el-option v-for="item in options" :key="item.value" :value="item.value" :label="item.label"></el-option>
  </el-select>
</template>

<script>
import {computed, ref, defineComponent, getCurrentInstance } from "@vue/composition-api";
import i18n from "@/core/plugins/vue-i18n.js"
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
    currentItem: {
      type: [Object],
      default: () => { return {} }
    },
    disabled: {
      type: [Boolean],
      default: false
    },
    options: {
      type: [Array],
      default: () => [
        {value: "1", label: i18n.t('DEVICE_MANAGEMENT.EQUIPMENT')},
        {value: "2", label: i18n.t('DEVICE_MANAGEMENT.THEGATEWAY')}
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
    function handleChange(value){
      // console.log("====handleChange", props.currentItem, value)
      // context.emit("change", value)
    }

    const { refs } = getCurrentInstance();
    function blur() {
      refs.selectRef.blur();
    }

    return {
      deviceTypeId,
      handleChange,
      blur
    }
  }
})
</script>

<style scoped>

</style>