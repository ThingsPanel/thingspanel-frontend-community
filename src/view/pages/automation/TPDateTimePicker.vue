<template>
  <div style="display: flex">
    <el-date-picker
        v-model="dateValue"
        type="date"
        placeholder="选择日期">
    </el-date-picker>
    <el-time-picker
        v-model="timeValue"

        placeholder="选择时间">
    </el-time-picker>
  </div>
</template>

<script>
import { ref, computed, defineComponent } from "@vue/composition-api";

export default defineComponent({
  name: "TPDateTimePicker",
  props: {
    value: {
      required: true,
      type: String
    }
  },
  setup(props, context) {
    let timeValue = ref("");
    let dateValue = ref("");
    timeValue = computed({
      get() {
        return props.value.substring(12)
      },
      set(val) {
        console.log(dateValue.value)
        context.emit("update:value", dateValue.value + " " + val)
      }
    })
    dateValue = computed({
      get() {
        return props.value.substring(0, 11)
      },
      set(val) {
        console.log(timeValue.value)
        context.emit("update:value", val + " " + timeValue.value)
      }
    })
    return {
      timeValue, dateValue
    }
  }
})
</script>

<style scoped>

</style>