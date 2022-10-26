<template>
  <div style="display: flex">

    <el-date-picker
        v-model="dateValue"
        type="date"
        :placeholder="$t('AUTOMATION.SELECT_DATE')">
    </el-date-picker>

    <el-time-picker
        v-model="timeValue"
        :placeholder="$t('AUTOMATION.SELECT_TIME')">
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
        console.log("TPDateTimePicker.timeValue.get")
        return props.value.substring(12)
      },
      set(val) {
        console.log("TPDateTimePicker.timeValue.set")
        context.emit("update:value", dateValue.value + " " + val)
      }
    });

    dateValue = computed({
      get() {
        console.log("TPDateTimePicker.dateValue.get")
        return props.value.substring(0, 11)
      },
      set(val) {
        console.log("TPDateTimePicker.dateValue.set")
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