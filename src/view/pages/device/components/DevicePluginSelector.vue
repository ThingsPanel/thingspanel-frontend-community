<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-28 15:11:01
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-27 13:36:21
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\device\components\DevicePluginSelector.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<!-- 设备插件下拉列表 -->
<template>
  <el-select
      class="w-100"
      :placeholder="$t('DEVICE_MANAGEMENT.PLACEHOLDER3')"
      :no-data-text="$t('PUBLIC.NODATA')"
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

    // 转换时间的函数
    
    
    return {
      device_plugin_type,
      handleChange
    }
  }
})
</script>

<style scoped>

</style>