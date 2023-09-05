<template>
<el-select
    class="w-100"
    v-model="fieldValue"
    :placeholder="$t('AUTOMATION.COMMAND')"
    :no-data-text="$t('COMMON.SELECT_NO_DATA')"

    filterable @change="handleChange"
>
  <el-option
      :value="item.name"
      :label="item.title" :key="index"
      v-for="(item, index) in instructOptions" ></el-option>
</el-select>
</template>

<script>
import {defineComponent, ref} from "@vue/composition-api";
import {computed, watch} from "@vue/composition-api/dist/vue-composition-api";
import {automation_instruct} from "@/api/automation";
import {json_parse_stringify} from "@/utils/helpers";
import PluginAPI from "@/api/plugin.js"

export default defineComponent({
  name: "InstructSelector",
  props: {
    device_id: {
      required:true,
      type: String,
    },
    plugin_id: {
      required:true,
      type: String,
    },
    field: {
      required: true,
      type: String,
    }
  },
  setup(props, context){
    let instructOptions = ref([])

    let fieldValue = computed({
      get(){
        return props.field
      },
      set(val){
        context.emit("update:field", val)
      }
    })

    // 获取下拉菜单
    // watch(()=>props.device_id, (val) =>{
    //   if(val){
    //     automation_instruct({bid: val}).then(({data})=>{
    //       if(data.code === 200 && data.data){
    //         instructOptions.value = washData(data.data)
    //
    //         if(props.field){
    //           // 修改控制策略时用，初始化数据
    //           update_apply_item(props.field)
    //         }
    //       }
    //     })
    //   }
    // },{
    //   immediate: true
    // })

    watch(() => props.plugin_id, val => {
      if (val) {
        let param = {current_page: 1, per_page: 10, id: val}
        PluginAPI.page(param)
            .then(({data}) => {
              if (data.code == 200 && data.data.data && data.data.data.length > 0) {
                let pluginJsonStr = data.data.data[0].chart_data ? data.data.data[0].chart_data : "{}";
                let pluginObj = JSON.parse(pluginJsonStr);
                console.log("pluginObj", pluginObj.tsl.properties)

                instructOptions.value = pluginObj.tsl.properties;
              }
            })
      }
    }, {
      immediate: true
    })

    // 去重
    // function washData(array_data){
    //   let map = new Map();
    //   for (let item of array_data){
    //     // 数据结构 {key:car, name: '汽车'}
    //     if(!map.has(item.key)){
    //       map.set(item.key, item);
    //     }
    //   }
    //
    //   return [...map.values()]
    // }

    // function update_apply_item(current_key){
    //   // 通过key找出当前的选项，
    //   let result = instructOptions.value.filter((item)=> item.key === current_key)
    //   if(result.length){
    //     // 更新到父级，用于表单条件验证
    //     props.apply_item.field_type = result[0].type
    //     props.apply_item.field_symbol = result[0].symbol
    //   }
    // }

    function handleChange(val){
      // update_apply_item(val)
      console.log("====InstructSelector.handleChange", val )
      context.emit('change', val)
    }


    return {
      instructOptions,
      fieldValue,
      handleChange,
    }
  }
})
</script>

<style scoped>

</style>