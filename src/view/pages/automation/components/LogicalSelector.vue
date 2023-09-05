<template>
<el-select 
    :no-data-text="$t('COMMON.SELECT_NO_DATA')"
    class="w-100"
    v-model="logicalValue"
>
  <el-option
      :value="item.value"
      :label="item.label"
      v-for="(item, index) in logicalOptions" :key="index"></el-option>
</el-select>
</template>

<script>
import {computed, defineComponent, ref} from "@vue/composition-api";

export default defineComponent({
  name: "LogicalSelector",
  props: {
    operator: {
      required: true,
      type: String,
    }
  },
  setup(props, context){
    let logicalValue = computed({
      get(){
        return props.operator
      },
      set(val){
        context.emit("update:operator", val)
      }
    })

    let logicalOptions = ref([
      {label: "或", value: "||"},
      {label: "且", value: "&&"},
    ])

    return {
      logicalValue,
      logicalOptions,
    }
  }
})
</script>

<style scoped>

</style>