<template>
    <div style="display: flex">
      <el-select style="width: 100px;margin-right:10px" v-model="value">
        <el-option label="分组1" :value="'group1'"></el-option>
      </el-select>
      <DeviceSelector v-if="value!=''"/>
    </div>
</template>

<script>
import DeviceSelector from "./DeviceSelector";
export default {
  name: "GroupSelector",
  components: {
    DeviceSelector
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