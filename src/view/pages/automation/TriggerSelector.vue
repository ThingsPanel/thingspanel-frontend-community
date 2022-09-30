<template>
  <el-select
      class="w-100"
      v-model="fieldValue"
      :placeholder="$t('AUTOMATION.PLACEHOLDER9')"
      size="medium"
      filterable
      @change="handleChange"
  >
    <el-option
        :value="item.key"
        :label="item.name" :key="index"
        v-for="(item, index) in triggerOptions"></el-option>
  </el-select>
</template>

<script>
import {computed, defineComponent} from "@vue/composition-api";
import {ref, watch} from "@vue/composition-api/dist/vue-composition-api";
import {automation_show} from "@/api/automation";

export default defineComponent({
  name: "TriggerSelector",
  props: {
    device_id: {
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

    watch(()=>props.device_id, (val)=>{
      if(val){
        automation_show({bid: val}).then(({data})=>{
          if(data.code === 200 && data.data){
            triggerOptions.value = data.data
          }
        })
      }
    }, {
      immediate: true
    })

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