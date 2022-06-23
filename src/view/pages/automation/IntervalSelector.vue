<template>
<el-select
    class="w-100"
    v-model="intervalValue"
>
  <el-option
      :value="item.value"
      :label="item.label"
      v-for="item in intervalOptions"></el-option>
</el-select>
</template>

<script>

import {computed, defineComponent, ref} from "@vue/composition-api";

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
      {label: "单次", value: 0},
      {label: "每天", value: 1},
    ])

    return {
      intervalValue,
      intervalOptions,
    }
  }
})
</script>

<style scoped>

</style>