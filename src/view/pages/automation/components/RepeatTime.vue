<template>
  <div style="display: inline-flex;">
      <el-input-number v-model="timeInterval" :min="minInterval"></el-input-number>
      <el-select :no-data-text="$t('COMMON.SELECT_NO_DATA')" style="width: 100px" placeholder="单位" v-model="timeIntervalUnit">
        <el-option value="second" label="秒/次">秒/次</el-option>
        <el-option value="minute" label="分钟/次">分钟/次</el-option>
        <el-option value="hour" label="小时/次">小时/次</el-option>
      </el-select>
  </div>
</template>

<script>
import  {computed, ref, defineComponent} from "@vue/composition-api";
import { getRandomString } from "@/utils/helpers"

export default defineComponent({
  name: "RepeatTime",
  props: {
    time_interval: {
      required: true,
      type: Number
    },
    unit: {
      type: String,
      default: "second"
    },
    rule_id: {
      type: String
    }
  },
  setup(props, context){

    let minInterval = ref(60);

    // 间隔时间，
    let timeInterval = computed({
      get(){
        return props.time_interval;
      },
      set(val){
        context.emit("update:time_interval", val);
      }
    });

    // 单位
    let timeIntervalUnit = computed({
      get(){
        return props.unit
      },
      set(val){
        if (val == "second") {
          minInterval.value = 60;
          if (timeInterval.value < 60) {
            timeInterval.value = 60;
          }
        } else {
          minInterval.value = 1;
        }
        context.emit("update:unit", val);
      }
    });

    if (props.rule_id == "") {
      // 自动生成ruleId
      let ruleId = getRandomString(10);
      context.emit("update:rule_id", ruleId);
    }

    return {
      timeInterval,
      minInterval,
      timeIntervalUnit
    }
  }
})

</script>

<style scoped>

</style>