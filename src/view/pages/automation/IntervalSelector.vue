<template>
<el-select
    class="w-100"
    v-model="intervalValue"
    @change="handleChange"
>
  <el-option
      :value="item.value"
      :label="item.label"
      v-for="item in intervalOptions"></el-option>
</el-select>
</template>

<script>

import {computed, defineComponent, ref} from "@vue/composition-api";
import i18n from "@/core/plugins/vue-i18n";
export default defineComponent({
  name: "IntervalSelector",
  props: {
    interval: {
      required: true,
      type: Number,
    }
  },
  setup(props, context){
    let intervalValue = computed({
      get(){
        return props.interval
      },
      set(val){
        context.emit("update:interval", val)
      }
    })

    let intervalOptions = ref([
      {label: i18n.t('AUTOMATION.ONCE'), value: 0},
      {label: i18n.t('AUTOMATION.DAYS'), value: 1},
    ])

    function handleChange(){
      context.emit('change')
    }

    return {
      intervalValue,
      intervalOptions,
      handleChange,
    }
  }
})
</script>

<style scoped>

</style>