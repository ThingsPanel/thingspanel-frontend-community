<template>
  <el-select
      class="w-100"
      v-model="conditionValue"
      :placeholder="$t('AUTOMATION.PLACEHOLDER8')"
  
      filterable
      @change="handleChange()"
  >
    <el-option
        :value="item.id"
        :label="item.id"
        v-for="(item, index) in symbolOptions" :key="index"></el-option>
  </el-select>
</template>

<script>
import {defineComponent} from "@vue/composition-api";
import {ref, computed} from "@vue/composition-api/dist/vue-composition-api";
import {automation_symbol} from "@/api/automation";

export default defineComponent({
  name: "SymbolSelector",
  props: {
    condition: {
      required: true,
      type: String,
    }
  },
  setup(props, context){
    let symbolOptions = ref([])

    let conditionValue = computed({
      get(){
        return props.condition
      },
      set(val){
        context.emit("update:condition", val)
      }
    })

    automation_symbol().then(({data})=>{
      if(data.code === 200 && data.data){
        symbolOptions.value = data.data
      }
    })

    function handleChange(){
      context.emit('change')
    }

    return {
      symbolOptions,
      conditionValue,
      handleChange,
    }
  }
})
</script>

<style scoped>

</style>