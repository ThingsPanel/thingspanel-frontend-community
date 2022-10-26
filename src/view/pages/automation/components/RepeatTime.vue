<template>
  <div style="display: inline-flex;">
      <el-input-number v-model="timeInterval"></el-input-number>
      <el-select style="width: 100px" placeholder="单位" v-model="timeIntervalUnit">
        <el-option value="second" label="秒">秒</el-option>
        <el-option value="minute" label="分钟" :disabled="true">分钟</el-option>
        <el-option value="hour" label="小时" :disabled="true">小时</el-option>
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
    },
    rule_id: {
      type: String
    }
  },
  setup(props, context){

    let timeIntervalUnit = ref("second");
    let timeInterval = computed({
      get(){
        return props.time_interval
      },
      set(val){
        context.emit("update:time_interval", val);
      }
    });

    let ruleId = getRandomString(10);
    context.emit("update:rule_id", ruleId);



    return {
      timeInterval,
      timeIntervalUnit
    }
  }
})

</script>

<style scoped>

</style>