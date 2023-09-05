<template>
  <el-select
      :no-data-text="$t('COMMON.SELECT_NO_DATA')"
      class="w-100"
      v-model="fieldValue"
      :placeholder="$t('AUTOMATION.PLACEHOLDER9')"
 
      filterable
      @change="handleChange"
  >
    <el-option :value="item.name" :label="item.title" :key="index" v-for="(item, index) in triggerOptions"></el-option>
  </el-select>
</template>

<script>
import {computed, defineComponent} from "@vue/composition-api";
import {ref, watch} from "@vue/composition-api/dist/vue-composition-api";
import {automation_show} from "@/api/automation";
import PluginAPI from "@/api/plugin.js"
export default defineComponent({
  name: "TriggerSelector",
  props: {
    device_id: {
      required: true,
      type: String,
    },
    plugin_id: {
      required: true,
      type: String,
    },
    field: {
      required: true,
      type: String,
    }
  },
  setup(props, context){
    let triggerOptions = ref([])

    let fieldValue = computed({
      get(){
        return props.field
      },
      set(val){
        context.emit("update:field", val)
      }
    })

    // watch(()=>props.device_id, (val)=>{
    //   if(val){
    //     automation_show({bid: val}).then(({data})=>{
    //       if(data.code === 200 && data.data){
    //         triggerOptions.value = data.data
    //       }
    //     })
    //   }
    // }, {
    //   immediate: true
    // });

    watch(()=>props.plugin_id, (val)=>{
      if(val){
        let param = {current_page: 1, per_page: 10, id: val}
        PluginAPI.page(param)
          .then(({data}) => {
            if (data.code == 200 && data.data.data && data.data.data.length > 0) {
              let pluginJsonStr = data.data.data[0].chart_data ? data.data.data[0].chart_data : "{}";
              let pluginObj = JSON.parse(pluginJsonStr);
              console.log("pluginObj", pluginObj.tsl.properties)

              triggerOptions.value = pluginObj.tsl.properties;
            }
          })
      }
    }, {
      immediate: true
    });


    function handleChange(val){
      context.emit("change")
    }

    return {
      triggerOptions,
      fieldValue,
      handleChange,
    }
  }
})
</script>

<style scoped>

</style>