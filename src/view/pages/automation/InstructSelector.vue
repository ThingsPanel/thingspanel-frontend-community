<template>
<el-select
    class="w-100"
    v-model="fieldValue"
    placeholder="条件"
    size="medium"
    filterable @change="handleChange"
>
  <el-option
      :value="item.key"
      :label="item.name"
      v-for="item in instructOptions"></el-option>
</el-select>
</template>

<script>
import {defineComponent, ref} from "@vue/composition-api";
import {computed, watch} from "@vue/composition-api/dist/vue-composition-api";
import {automation_instruct} from "@/api/automation";

export default defineComponent({
  name: "InstructSelector",
  props: {
    device_id: {
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
    watch(()=>props.device_id, (val) =>{
      console.log(val)
      if(val){
        automation_instruct({bid: val}).then(({data})=>{
          if(data.code === 200 && data.data){
            instructOptions.value = washData(data.data)
          }
        })
      }
    },{
      immediate: true
    })

    // 去重
    function washData(array_data){
      let map = new Map();
      for (let item of array_data){
        // 数据结构 {key:car, name: '汽车'}
        if(!map.has(item.key)){
          map.set(item.key, item);
        }
      }

      return [...map.values()]
    }

    function handleChange(val){
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