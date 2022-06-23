<template>
<el-select
    class="w-100"
    v-model="typeValue"
>
  <el-option
      :value="item.value"
      :label="item.label"
      v-for="item in typeOptions"></el-option>
</el-select>
</template>

<script>
import {computed, defineComponent} from "@vue/composition-api";
import {ref} from "@vue/composition-api/dist/vue-composition-api";

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
      {label: "设备条件类型", value: 1},
      {label: "时间条件类型", value: 2},
    ])

    return {
      typeValue,
      typeOptions,
    }
  }
})
</script>

<style scoped>

</style>