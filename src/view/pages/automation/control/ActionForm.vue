<template>
  <div>
    <el-form-item style="width:100%" :label="$t('AUTOMATION.THEN')">
      <div style="display: flex;margin-bottom: 10px" v-for="(action, index) in actions" :key="index">

        <el-select ref="actionTypeRef" style="width: 120px;margin-right:20px" :placeholder="$t('AUTOMATION.PLACEHOLDER.ACTION_TYPE')" v-model="action.type"
                   :disabled="actions.length > (index+1)"
                   @change="v=>handleChangeActionType(action, v)">
          <el-option v-for="(item, index) in action.typeOptions" :key="index" :label="item.label" :value="item.value"></el-option>
        </el-select>

        <!-- 操作设备 -->
        <CommandDevice ref="commandRef" v-if="action.type=='device'" :data="action.data" @change="v=>handleCommandChange(action, v)"/>


        <!-- 激活场景 -->
        <SceneSelector ref="sceneRef" v-if="action.type=='scene'" :value="action.value" @change="v=>handleSceneChange(action, v)"/>

        <!-- 告警通知 -->
        <AlarmNotification ref="alarmRef" v-if="action.type=='alarm'" :data="action.data" @change="v=>handleAlarmChange(action, v)"/>
        <!-- <el-button v-if="action.type=='device'" type="danger" size="mini">{{ $t('AUTOMATION.DELETE') }}</el-button> -->
        
        <div style="margin-left:20px;">
          <el-button style="height:40px" type="danger" size="small" :v-if="actions.length > 0" @click="handleDeleteAction(action)">{{ $t('AUTOMATION.DELETE') }}</el-button>
        </div>
        
      </div>
      <el-button type="border" size="mini" :disabled="actions.length > 2" @click="handleAddAction">{{ $t('AUTOMATION.ADD_ACTION_TYPE') }}</el-button>
    </el-form-item>
  </div>
</template>

<script>
import {message_error} from "@/utils/helpers";
import CommandDevice from "./action/CommandDevice";
import SceneSelector from "./action/SceneSelector";
import AlarmNotification from "./action/AlarmNotification.vue";
import i18n from "@/core/plugins/vue-i18n"

const actionTypeOptions = [
  { label: i18n.t('AUTOMATION.OPERATING_DEVICE'), value: "device" },
  { label: i18n.t('AUTOMATION.ACTIVATION_SCENARIO'), value: "scene" },
  { label: i18n.t('AUTOMATION.TRIGGER_ALARM'), value: "alarm" },
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
        message_error(this.$t('AUTOMATION.ERROR.ACTION_TYPE'));
        return;
      }
      // 已选动作
      let list = this.actions.map(item => item.type);
      // 剔除已选动作
      let arr = actionTypeOptions.filter(type => !list.some(item => item == type.value));
      this.actions.push({ type: "", typeOptions: arr, disabled: false})
    },
    handleChangeActionType(action, v) {

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
    },
    validate() {
      if (this.actions.length === 0) {
        message_error(this.$t('AUTOMATIN.ERROR.ACTION_TYPE'));
        return false;
      }
      for (let index = 0; index < this.actions.length; index++) {
        const item = this.actions[index];
        if (!item.type || item.type === "") {
          this.$refs.actionTypeRef[index].focus();
          message_error(this.$t('AUTOMATION.ERROR.ATLEAST_ONE_ACTION_TYPE'));
          return false;
        }
        console.log(this.$refs.commandRef, this.$refs.sceneRef, this.$refs.alarmRef)
        if (this.$refs.commandRef && this.$refs.commandRef.length > 0 && !this.$refs.commandRef[0].validate()) return false;
        if (this.$refs.sceneRef && this.$refs.sceneRef.length > 0 && !this.$refs.sceneRef[0].validate()) return false;
        if (this.$refs.alarmRef && this.$refs.alarmRef.length > 0 && !this.$refs.alarmRef[0].validate()) return false;
      }
      return true;
    },
    /**
     * @description: 删除动作
     * @param {*} action
     * @return {*}
     */    
    handleDeleteAction(action) {
      const index = this.actions.findIndex(item => item == action);
      this.actions.splice(index, 1);
      this.setActionTypeOptions();
    },
  }
}
</script>

<style scoped>

</style>