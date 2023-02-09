<template>
  <div>
    <el-form-item label="那么：">
      <div style="display: flex;margin-bottom: 10px" v-for="(action, index) in actions" :key="index">

        <el-select style="width: 100px;margin-right:10px" placeholder="选择执行动作" v-model="action.type"
                   :disabled="actions.length > (index+1)"
                   @change="v=>handleChangeActionType(action, v)">
          <el-option v-for="(item, index) in action.typeOptions" :key="index" :label="item.label" :value="item.value"></el-option>
        </el-select>

        <!-- 操作设备 -->
        <CommandDevice v-if="action.type=='device'" :data="action.data" @change="v=>handleCommandChange(action, v)"/>

        <!-- 激活场景 -->
        <SceneSelector v-if="action.type=='scene'" :data="action.data" @change="v=>handleSceneChange(action, v)"/>

        <!-- 告警通知 -->
        <AlarmNotification v-if="action.type=='alarm'" :data="action.data" @change="v=>handleAlarmChange(action, v)"/>

      </div>
      <el-button type="border" size="mini" :disabled="actions.length > 2" @click="handleAddAction">新增执行动作</el-button>
    </el-form-item>
  </div>
</template>

<script>
import {message_error} from "@/utils/helpers";
import CommandDevice from "./action/CommandDevice";
import SceneSelector from "./action/SceneSelector";
import AlarmNotification from "./action/AlarmNotification.vue";

const actionTypeOptions = [
  { label: "操作设备", value: "device" },
  { label: "激活场景", value: "scene" },
  { label: "触发告警", value: "alarm" },
];
export default {
  name: "ActionForm",
  components: { CommandDevice, SceneSelector, AlarmNotification },
  props: {
    data: {
      type: [Array],
      default: () => []
    }
  },
  data() {
    return {
      actions: [
          { type: "", typeOptions: actionTypeOptions, disabled: false }
        ]
    }
  },
  watch: {
    data: {
      handler(newValue) {
        console.log("====actionform", newValue);

        if (newValue) {
          this.actions = JSON.parse(JSON.stringify(newValue));
          this.setActionTypeOptions();
        }
      },immediate: true
    }
  },
  created() {
    // this.setActionTypeOptions();
  },
  methods: {
    /**
     * @description: 初始化执行动作类型下拉列表
     * @return {*}
     */    
    setActionTypeOptions() {
      console.log("====ActionForm.setActionTypeOptions")
      let list = JSON.parse(JSON.stringify(actionTypeOptions));
      this.actions.forEach(action => {
        if (action.type) {
          action.typeOptions = JSON.parse(JSON.stringify(list));
          let index = list.findIndex(item => item.value == action.type);
          list.splice(index, 1);
        }
      })
    },
    /**
     * @description: 新增一个执行动作
     * @return {*}
     */    
    handleAddAction() {
      let result = this.actions.every(item => item.type != "");
      if (!result) {
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
      console.log("====handleChangeActionType", action, v)

    },
    /**
     * @description: 操作设备更改
     * @param {*} v
     * @return {*}
     */    
    handleCommandChange(action, v) {
      // for (const item in v) {
      //   action[item] = v[item];
      // }
      action.data = v;
      action.type = "device";
      this.updateData();
    },
    /**
     * @description: 场景更改
     * @param {*} v
     * @return {*}
     */    
    handleSceneChange(action, v) {
      console.log("====handleSceneChange")

      action.type = "scene";
      action.value = v;
      this.updateData();
    },
    /**
     * @description: 通知更改
     * @param {*} v
     * @return {*}
     */    
    handleAlarmChange(action, v) {
      // for (const item in v) {
      //   action[item] = v[item];
      // }
      action.data = v;
      this.updateData();
    },
    /**
     * @description: 向父组件传值
     * @return {*}
     */    
    updateData() {
      this.actions.forEach(item => {
        delete item.typeOptions;
        delete item.disabled;
      })
      this.$emit("change", this.actions);
    }
  }
}
</script>

<style scoped>

</style>