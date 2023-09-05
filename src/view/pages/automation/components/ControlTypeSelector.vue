<template>
<el-select
   :no-data-text="$t('COMMON.SELECT_NO_DATA')"
    class="w-100"
    v-model="typeValue"
    @change="handleChange"
>
  <el-option
      :value="item.value"
      :label="item.label"
      v-for="(item, index) in typeOptions" :key="index"></el-option>
</el-select>
</template>

<script>
import {computed, defineComponent} from "@vue/composition-api";
import {ref} from "@vue/composition-api/dist/vue-composition-api";
import i18n from "@/core/plugins/vue-i18n"


export default defineComponent({
  name: "ControlTypeSelector",
  props: {
    type: {
      required: true,
    }
  },
  setup(props, context){
    let typeValue = computed({
      get(){
        return props.type
      },
      set(val){
        context.emit("update:type", val)
      }
    })

    let typeOptions = ref([
      {label: i18n.t('AUTOMATION.DEVICE_CONDITION_TYPE'), value: 1},
      {label: i18n.t('AUTOMATION.TIME_CONDITION_TYPE'), value: 2},
    ])

    function handleChange(val){
      context.emit("change", val)
    }

    return {
      typeValue,
      typeOptions,
      handleChange,
    }
  }
})
</script>

<style scoped>

</style>