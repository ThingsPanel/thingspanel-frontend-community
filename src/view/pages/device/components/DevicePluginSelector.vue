<!-- 设备插件下拉列表 -->
<template>
  <el-select
      class="w-100"
      :placeholder="$t('COMMON.DEVICE_PLUG_SELECTOR_PLACEHOLDER')"
      size="medium"
      v-model="device_plugin_type"
      filterable
      :clearable="clearable"
      @change="handleChange()"
  >
    <el-option
        v-for="item in options"
        :key="item.id"
        :label="item.name"
        :value="item.id"
    ></el-option>
  </el-select>
</template>

<script>
import {computed, defineComponent} from "@vue/composition-api";

export default defineComponent({
  name: "DevicePluginSelector",
  props: {
    clearable: {
      default: false,
      type: Boolean,
    },
    plugin_type:{
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

    let device_plugin_type = computed({
      get(){
        return props.plugin_type
      },
      set(val){
        context.emit("update:plugin_type", val)
      }
    })

    function handleChange(){
      context.emit("change")
    }

    return {
      device_plugin_type,
      handleChange
    }
  }
})
</script>

<style scoped>

</style>