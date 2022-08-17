<template>
  <div>
    <el-time-picker
        key="timepicker"
        v-show="interval == 1"
        v-model="timeValue"
        class="w-100"
        :clearable="false"
        :placeholder="$t('AUTOMATION.SELECT_TIME')"
        value-format="HH:mm:ss"
    ></el-time-picker>
    <TPDateTimePicker v-show="interval == 0" :value.sync="timeValue"></TPDateTimePicker>
<!--    <el-date-picker-->
<!--        key="datepicker"-->
<!--        v-show="interval == 0"-->
<!--        v-model="timeValue"-->
<!--        type="datetime"-->
<!--        class="w-100"-->
<!--        :clearable="false"-->
<!--        placeholder="选择日期时间"-->
<!--        value-format="yyyy-MM-dd HH:mm:ss"-->
<!--    ></el-date-picker>-->

  </div>

</template>

<script>
import {computed, defineComponent} from "@vue/composition-api";
import TPDateTimePicker from "./TPDateTimePicker";
export default defineComponent({
  name: "TImeSelector",
  components: {
    TPDateTimePicker
  },
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