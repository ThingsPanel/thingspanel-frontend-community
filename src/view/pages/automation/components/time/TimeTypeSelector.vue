<template>
  <div style="display: flex">
    <el-select style="width: 100px;margin-right:10px" v-model="value">
      <el-option label="单次" value="once"></el-option>
      <el-option label="重复" value="repeat"></el-option>
      <el-option label="范围" value="range"></el-option>
    </el-select>

    <OnceTimeSelector v-if="value=='once'"/>

    <RepeatTimeSelector v-else-if="value=='repeat'"/>

    <DateRangeSelector v-else-if="value=='range'"/>
  </div>
</template>

<script>
import OnceTimeSelector from "./OnceTimeSelector";
import RepeatTimeSelector from "./RepeatTimeSelector";
import DateRangeSelector from "./DateRangeSelector";
export default {
  name: "TimeTypeSelector",
  components: { OnceTimeSelector, RepeatTimeSelector, DateRangeSelector },
  data() {
    return {
      value: ""
    }
  }
}
</script>

<style scoped>

</style>