<template>
  <el-time-picker
      v-if="interval == 1"
      v-model="timeValue"
      class="w-100"
      :clearable="false"
      placeholder="选择时间"
      value-format="HH:mm:ss"
  ></el-time-picker>
  <el-date-picker
      v-else-if="interval == 0"
      v-model="timeValue"
      type="datetime"
      class="w-100"
      :clearable="false"
      placeholder="选择日期时间"
      value-format="yyyy-MM-dd HH:mm:ss"
  ></el-date-picker>
</template>

<script>
import {computed, defineComponent} from "@vue/composition-api";

export default defineComponent({
  name: "TImeSelector",
  props: {
    interval: {
      required: true,
    },
    time: {
      required: true,
      type: String,
    }
  },
  setup(props, context){
    let timeValue = computed({
      get(){
        return props.time
      },
      set(val){
        context.emit("update:time", val)
      }
    })

    return {
      timeValue
    }
  }
})
</script>

<style scoped>

</style>