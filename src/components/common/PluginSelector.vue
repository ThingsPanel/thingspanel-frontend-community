<template>
  <el-cascader
      placeholder="请选择设备插件"
      v-model="businessCascaderData"
      size="medium"
      :options="optionsList"
      :clearable="clearable"
      class="w-100"
      @change="handleChange()"
  >
  </el-cascader>
</template>

<script>
import {defineComponent} from "@vue/composition-api";
import {computed, reactive} from "@vue/composition-api/dist/vue-composition-api";
import PluginAPI from "@/api/plugin.js"
import { ref } from "@vue/composition-api/dist/vue-composition-api";

export default defineComponent({
  name: "PluginSelector",
  props: {
    business_id:{
      required: true,
      type: String,
    },
    clearable: {
      default: true
    }
  },
  setup(props, context){
    // 业务
    let businessCascaderData = computed({
      get(){
        return [props.business_id]
      },
      set(val){
        // 触发事件更新 props.business_id
        context.emit('update:business_id', val.join(""))
      }
    })

    let optionsList = ref([])
    function getOptionsList() {
      PluginAPI.tree().then(({data})=>{
          if(data.code === 200 && data) {
            optionsList = data.data.map((item)=>({
              value: item.dict_value,
              label: item.model_name
            }))
          }
        })
    }

    getOptionsList()

    function handleChange(){
      context.emit('change')
    }

    return {
      businessCascaderData,
      optionsList,
      handleChange,
    }
  }
})
</script>

<style scoped>

</style>