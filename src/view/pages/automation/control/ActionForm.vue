<template>
  <div>
    <el-form-item label="那么：">
      <div style="display: flex;margin-bottom: 10px" v-for="(action, index) in actions" :key="index">

        <el-select style="width: 100px;margin-right:10px" v-model="action.type" placeholder="选择执行动作">
          <!-- 操作设备-->
          <el-option label="操作设备" :value="'device'"></el-option>
          <!-- 激活场景-->
          <el-option label="激活场景" :value="'scene'"></el-option>
          <!-- 触发告警-->
          <el-option label="触发告警" :value="'alert'"></el-option>
        </el-select>

        <CommandDevice v-if="action.type=='device'"/>


      </div>
    </el-form-item>
  </div>
</template>

<script>
import CommandDevice from "./CommandDevice";
export default {
  name: "ActionForm",
  components: { CommandDevice },
  data() {
    return {
      actions: [
        { type: "" }
      ]
    }
  }
}
</script>

<style scoped>

</style>