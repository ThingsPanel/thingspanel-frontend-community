<template>
  <div>
    <!-- interval为1时，每天   -->
    <el-time-picker
        key="timepicker"
        v-if="interval == 1"
        v-model="timeValue"
        class="w-100"
        :clearable="false"
        :placeholder="$t('AUTOMATION.SELECT_TIME')"
        value-format="HH:mm:ss"
    ></el-time-picker>

    <!-- interval为0时，单次   -->
<!--    <TPDateTimePicker v-show="interval == 0" :value.sync="timeValue"></TPDateTimePicker>-->

    <el-date-picker v-else-if="interval == 0" style="z-index: 9999!important;"
        v-model="timeValue"
        type="datetime"
        default-time="12:00:00"
        placeholder="选择日期时间">
    </el-date-picker>


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
import  {computed, defineComponent} from "@vue/composition-api";
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
      type: [String, Object, Date],
      default: ""
    }
  },
  setup(props, context){
    let timeValue = computed({
      get(){
        console.log("TimeSelector.timeValue.get", props.time)
        return props.time
      },
      set(val){
        console.log("TimeSelector.timeValue.set", val)
        context.emit("update:time", val)
      }
    });


    return {
      timeValue
    }
  }
})
</script>

<style scoped lang="scss">
::v-deep .el-picker-panel {
  z-index: 2099!important;
}
</style>