<template>
  <div>
    <el-form-item label="那么：">
      <div style="display: flex;margin-bottom: 10px" v-for="(action, index) in actions" :key="index">

        <el-select style="width: 100px;margin-right:10px" placeholder="选择执行动作" v-model="action.type"
                   :disabled="actions.length > (index+1)"
                   @change="v => handleChangeActionType(action, v)">
          <el-option v-for="(item, index) in action.typeOptions" :key="index" :label="item.label" :value="item.value"></el-option>
        </el-select>

        <CommandDevice v-if="action.type=='device'"/>

        <SceneSelector v-if="action.type=='scene'"/>


      </div>
      <el-button type="border" size="mini" :disabled="actions.length > 2" @click="handleAddAction">新增执行动作</el-button>
    </el-form-item>
  </div>
</template>

<script>
import {message_error} from "@/utils/helpers";
import CommandDevice from "./CommandDevice";
import SceneSelector from "./action/SceneSelector";
const actionTypeOptions = [
  { label: "操作设备", value: "device" },
  { label: "激活场景", value: "scene" },
  { label: "触发告警", value: "alert" },
];
export default {
  name: "ActionForm",
  components: { CommandDevice, SceneSelector },
  data() {
    return {
      actions: [
        { type: "", typeOptions: actionTypeOptions, disabled: false }
      ]
    }
  },
  created() {

  },
  methods: {
    handleAddAction() {
      let result = this.actions.every(item => !item.type);
      if (result) {
        message_error("请选择一个执行动作");
        return;
      }
      // 已选动作
      let list = this.actions.map(item => item.type);
      // 剔除已选动作
      let arr = actionTypeOptions.filter(type => !list.some(item => item == type.value));
      this.actions.push({ type: "", typeOptions: arr, disabled: false})
    },
    handleChangeActionType(action, v) {


    }
  }
}
</script>

<style scoped>

</style>