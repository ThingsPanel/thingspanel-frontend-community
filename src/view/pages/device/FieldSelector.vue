<template>
  <el-select v-model="field_to_value" size="medium" @blur="handleBlur">
    <el-option-group
        class="w-100"
        v-for="group in groupOptions"
        :key="group.label"
        :label="group.label">
      <el-option
          v-for="item in group.options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
          :disabled="item.disabled"
      ></el-option>
    </el-option-group>
  </el-select>
</template>

<script>
import {computed, defineComponent} from "@vue/composition-api";

export default defineComponent({
  name: "FieldSelector",
  props: {
    field_to: {
      required: true,
      type: String,
    },
    groupOptions: {
      required: true,
      type: Array,
    }
  },
  setup(props, context){
    let field_to_value = computed({
      get(){
        return props.field_to
      },
      set(val){
        context.emit("update:field_to", val)
      }
    })

    function handleBlur(){
      context.emit('blur')
    }

    return {
      field_to_value,
      handleBlur
    }
  }
})
</script>

<style scoped>

</style>