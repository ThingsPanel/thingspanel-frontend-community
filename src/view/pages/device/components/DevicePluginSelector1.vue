<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-28 15:11:01
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-29 09:03:13
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
      @visible-change="handleVisibleChange"
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
import PluginAPI from "@/api/plugin";
export default defineComponent({
  name: "DevicePluginSelector",
  props: {
    clearable: {
      default: false,
      type: Boolean,
    },
    pluginType:{
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
        return props.pluginType
      },
      set(val){
        context.emit("update:pluginType", val)
      }
    })

    function handleChange(){
      context.emit("change")
    }

    // 转换时间的函数
    const pluginList = ref([]);
    function handleVisibleChange(val){
      if(val) {
        console.log("下拉列表展开", val);
        PluginAPI.page({ current_page: 1, per_page: 1000 })
          .then(({ data: result }) => {
            if (result.code === 200) {
              pluginList.value = result.data?.data || [];
            }
          })
      }
    }
    
    return {
      device_plugin_type,
      handleChange, handleVisibleChange
    }
  }
})
</script>

<style scoped>

</style>