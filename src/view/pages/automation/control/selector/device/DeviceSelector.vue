<template>
  <div style="display: flex">
    <el-select style="width: 100px;margin-right:10px" v-model="value">
      <el-option label="设备1" :value="'device1'"></el-option>
    </el-select>

    <StateSelector v-if="value!=''"/>
  </div>


</template>

<script>
import StateSelector from "./StateSelector";
export default {
  name: "DeviceSelector",
  components: {
    StateSelector
  },
  data() {
    return {
      value: ""
    }
  }
}
</script>

<style scoped>

</style>