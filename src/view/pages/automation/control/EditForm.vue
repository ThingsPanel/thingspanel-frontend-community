<template>
  <el-dialog
      :title="formData.id ? $t('AUTOMATION.CONTROL_STRATEGY.EDIT_CONTROL_STRATEGY') : $t('AUTOMATION.CONTROL_STRATEGY.ADD_CONTROL_STRATEGY')"
      class="el-dark-dialog"
      :close-on-click-modal="false"
      :visible.sync="dialogVisible"
      width="60%"
      height="60%"
      top="10vh"
  >
    <el-form label-position="left" label-width="85px">
      <el-row :gutter="20">
        <!-- 自动化名称-->
        <el-col :span="8">
          <el-form-item label="自动化名称">
            <el-input v-model="formData.automation_name"></el-input>
          </el-form-item>
        </el-col>

        <!-- 描述-->
        <el-col :span="8">
          <el-form-item label="描述">
            <el-input v-model="formData.automation_described"></el-input>
          </el-form-item>
        </el-col>

        <!-- 优先级-->
        <el-col :span="8">
          <el-form-item label="优先级">
            <el-input-number :min="0" :max="100" v-model="formData.priority"></el-input-number>
            <el-tooltip class="item" effect="dark" content="值越小优先级越高" placement="top-start">
              <i class="el-icon-info"></i>
            </el-tooltip>
            
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 条件  -->
      <ConditionForm :data="formData.conditions" @change="handleConditionChange"/>

      <!-- 执行动作 -->
      <ActionForm :data="formData.actions" @change="handleActionChange"/>

      <div class="text-right">
        <el-button size="medium" type="save" @click="handleSaveAndStart()">保存并执行</el-button>
        <el-button size="medium" type="cancel" @click="handleSave()">仅保存</el-button>
      </div>
    </el-form>
  </el-dialog>

</template>

<script>
import ConditionForm from "./ConditionForm";
import ActionForm from "./ActionForm";
import Auto from "@/api/automation_1.0"
import { message_success } from '../../../../utils/helpers';

/**
 * @description: 条件类型
 */
 const ConditionType = { 
  // 设备条件
  device: "1", 
  // 时间条件
  time: "2",
  // 通过value获取key
  getKey: value => Object.keys(ConditionType).find(key => ConditionType[key] === value)
};

/**
 * @description: 设备条件类型
 */
const StateMode = { 
  // 属性
  property: "1", 
  // 事件
  event: "2", 
  // 在线离线状态
  state: "3",
  // 通过value获取key
  getKey: value => Object.keys(StateMode).find(key => StateMode[key] === value)
};

/**
 * @description: 时间条件类型
 */
const TimeType = {
  // 时间范围
  range: "0",
  // 单次
  once: "1",
  // 重复
  repeat: "2",
  // 自定义
  custom: "3",
  // 通过value获取key
  getKey: value => Object.keys(TimeType).find(key => TimeType[key] === value)
}

/**
 * @description: 重复时间类型
 */
const RepeatTimeType = {
  // 每小时
  perHour: "1",
  // 每天
  days: "2",
  // 每周
  weekly: "3",
  // 每月
  monthly: "4",
  // 通过value获取key
  getKey: value => Object.keys(RepeatTimeType).find(key => RepeatTimeType[key] === value)
}

/**
 * @description: 动作类型
 */
const ActionType = { 
  // 操作设备
  device: "1", 
  // 触发告警  
  alarm: "2", 
  // 激活场景
  scene: "3",
  // 通过value获取key
  getKey: value => Object.keys(ActionType).find(key => ActionType[key] === value)
}

/**
 * @description: 命令类型
 */
const CommandType = {
  // 设置属性
  property: 1,
  // 服务
  service: 2
}

export default {
  name: "EditForm",
  components: {
    ConditionForm, ActionForm
  },
  props: {
    /**
     * 是否显示编辑/新建对话框
     */
    visible: {
      type: [Boolean],
      default:  false
    },
    data: {
      type: [Object],
      default:  () => {return {} }
    }
  },
  data() {
    return {
      formData: {
        automation_name: "",
        automation_described: "",
        priority: "",
        conditions: [
          {}
        ],
        actions: []
      }
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit("update:visible", val);
      }
    }
  },
  watch: {
    visible: {
      handler(newValue) {
        if (newValue) {
          this.initFormData();
        }
      }
    }
  },
  methods: {
    /**
     * @description: 初始化表单数据
     * @return {*}
     */    
    initFormData() {
      if (!this.data.id) {
        // 新增
        this.formData = {
          automation_name: "",
          automation_described: "",
          priority: "",
          conditions: [{}],
          actions: []
        }
      } else {
        // 编辑
        Auto.Control.get({id: this.data.id})
          .then(({ data: result }) => {
            if (result.code === 200) {
              let data = JSON.parse(JSON.stringify(result?.data || {}));
              data.conditions = this.getConditions(data.automation_conditions);
              data.actions = this.getActions(data.automation_actions);
              this.formData = data;
            }
          })
      }
    },
    handleConditionChange(v) {
      this.formData.conditions = v;
    },
    handleActionChange(v) {
      this.formData.actions = v;
    },
    /**
     * @description: 保存并启用
     * @return {*}
     */    
    handleSaveAndStart() {
      this.handleSave(1);
    },
    /**
     * @description: 保存
     * @param {*} enabled
     * @return {*}
     */    
    handleSave(enabled = 0) {
      let data = JSON.parse(JSON.stringify(this.formData));
      data.enabled = enabled.toString();   // 是否启用
      
      data.automation_conditions = this.setConditions(data.conditions);
      delete data.conditions;
      
      data.automation_actions = this.setActions(data.actions);
      delete data.actions;
     
      if (data.id) {
        // 编辑
        Auto.Control.edit(data)
          .then(({data: result}) => {
            if (result.code === 200) {
              this.$emit("submit");
              message_success("编辑成功！")
              this.dialogVisible = false;
            }
          })
          .finally(() => {

          })
      } else {
        // 新增
        Auto.Control.add(data)
          .then(({data: result}) => {
            if (result.code === 200) {
              this.$emit("submit");
              message_success("新增成功！");
              this.dialogVisible = false;
            }
          })
          .finally(() => {
            
          })
      }
    },
    /**
     * @description: 设置条件, 适配后端接口
     * @param {*} conditions
     * @return {*}
     */    
    setConditions(conditions) {
      let group_number = 1;
      const washCondition = (c) => {
          let condition = {};
          
          if (c.type === "device") {
            // ================================== 设备条件 =====================================
            condition = {
              condition_type: ConditionType.device,
              device_id: c.data.deviceId,
              device_condition_type: StateMode[c.data.state.mode]
            };
            if (condition.device_condition_type === StateMode.property) {
              condition['v1'] = c.data.state.name;
              condition['v2'] = c.data.state.operator.symbol;
              condition['v3'] = c.data.state.operator.value;
            } else if (condition.device_condition_type === StateMode.state) {

            }
          } else if (c.type === "time") {
            // ================================== 时间条件 =====================================
            console.log("时间条件", c)
            condition = {
              condition_type: ConditionType.time,
              time_condition_type: TimeType[c.data.type]
            }
            switch (condition.time_condition_type) {
              case TimeType.once: {
                // 单次
                condition['v1'] = c.data.once.value
                break;
              }
              case TimeType.repeat: {
                // 重复
                const repeat = c.data.repeat;
                condition['v1'] = RepeatTimeType[repeat.type].toString();

                switch (RepeatTimeType[repeat.type]) {
                  case RepeatTimeType.perHour: {
                    // 每小时
                    condition['v3'] = repeat.perHour.toString();
                    break;
                  }
                  case RepeatTimeType.days: {
                    // 每天
                    condition['v3'] = repeat.days.toString()
                    break;
                  }
                  case RepeatTimeType.weekly: {
                    // 每周
                    condition['v3'] = repeat.weekly.week.toString();
                    condition['v4'] = repeat.weekly.time.toString();
                    break;
                  }
                  case RepeatTimeType.monthly: {
                    // 每月
                    condition['v3'] = repeat.monthly.day.toString();
                    condition['v4'] = repeat.monthly.time.toString();
                    break;
                  }
                }
                break;
              }
              case TimeType.range: {
                // 时间范围
                condition['v1'] = c.data.range[0];
                condition['v2'] = c.data.range[1];
                break;
              }
            }
            console.log("setConditions", condition)

          }

          if (c.relation && c.relation =="or") {
            group_number++;
          }
          condition.group_number = group_number;

          return condition;
      }

      let conditionList = [];
      conditions.length > 0 && conditions.forEach(item => {
        conditionList.push(washCondition(item));
      })
      return conditionList;
    },
    /**
     * @description: 设置动作, 适配后端接口
     * @param {*} actions
     * @return {*}
     */    
    setActions(actions) {
      const washAction = a => {
        let action = {};
        // 动作类型
        action.action_type = ActionType[a.type];
        console.log("====washAction", a, action)
        switch (action.action_type) {
          case ActionType.device: {
            // 操作设备
            a.data.forEach(item => {
              let instruct = {};
              instruct[item.state.name] = item.state.operator.value;
              let additionalInfo = {
                device_model: "1",
                instruct
              }
              actionList.push(
                {
                  ...action, 
                  device_id: item.deviceId,     // 设备id
                  additional_info: JSON.stringify(additionalInfo)
                }
              )
            })
            break;
          }
          case ActionType.scene: {
            // 激活场景
            action.scenario_strategy_id = a.value || "";     // 场景策略id
            actionList.push(action);
            break;
          }
          case ActionType.alarm: {
            // 触发告警
            action.warning_strategy = {};
            action.warning_strategy.warning_strategy_name = this.formData.automation_name;   // 告警名称
            action.warning_strategy.warning_level = a.data.warningLevel;     // 告警级别
            action.warning_strategy.group = a.data.group;                    // 通知用户组
            action.warning_strategy.repeat_count = Number(a.data.repeatTimes);      // 重复次数
            action.warning_strategy.inform_way = a.data.notification.join(",");        // 通知方式
            actionList.push(action);
            break;
          }
        }
      }

      let actionList = [];
      actions.length > 0 && actions.forEach(item => {
        washAction(item);
      })

      return actionList;
    },
    /**
     * @description: 回显condition
     * @param {*} conditions
     * @return {*}
     */        
    getConditions(conditions) {
      let conditionList = [];
      conditions.forEach(item => {
        let condition = { };
        if (item.condition_type == ConditionType.device) {
          // 设备条件
          condition.type = ConditionType.getKey(item.condition_type);
          condition.data = {
            projectId: item.business_id,
            groupId: item.asset_id,
            deviceId: item.device_id
          };
          condition.data.state = {
            name: item.v1,
            mode: StateMode.getKey(item.device_condition_type),
            operator: {
              symbol: item.v2,
              value: item.v3
            }
          };
        } else {
          // 时间条件
          console.log("时间条件1", item);
          condition.type = ConditionType.getKey(item.condition_type);
          condition.data = {
            type: TimeType.getKey(item.time_condition_type)
          }
          console.log("时间条件2", item, condition.data)
          switch (item.time_condition_type) {
            case TimeType.once: {
              // 单次
              condition.data.once = {
                value: item.v1
              }
              break;
            }
            case TimeType.repeat: {
              condition.data.repeat = { type: RepeatTimeType.getKey(item.v1) };
              // 重复
              switch (item.v1) {
                case RepeatTimeType.perHour: {
                  // 每小时
                  condition.data.repeat.perHour = item.v3;
                  break;
                }
                case RepeatTimeType.days: {
                  // 每天
                  condition.data.repeat.days = item.v3
                  break;
                }
                case RepeatTimeType.weekly: {
                  // 每周
                  condition.data.repeat.weekly = {
                    week: item.v3,
                    time: item.v4
                  }
                  break;
                }
                case RepeatTimeType.monthly: {
                  condition.data.repeat.monthly = {
                    day: item.v3,
                    time: item.v4
                  }
                }
              }
              break;
            }
            case TimeType.range: {
              // 范围
              condition.data.range = [item.v1, item.v2]
              break;
            }
            case TimeType.custom: {
              // 自定义
              
              break;
            }
          }
          console.log("时间条件3", condition)

        }
        conditionList.push(condition);
      })
      return conditionList;
    },
    /**
     * @description: 回显action
     * @return {*}
     */    
    getActions(actions) {
      let actionList = [];
      let commands = [];
      actions.forEach(item => {
        let action = {};
        if (item.action_type === ActionType.device) {
          // 操作设备
          let command = {
            projectId: item.business_id,
            groupId: item.asset_id,
            deviceId: item.device_id,
            state: {}
          };
          const additionalInfo = JSON.parse(item.additional_info);
          const name = Object.keys(additionalInfo.instruct)[0];
          command.state = {
            name,
            mode: "property",
            operator: {
              symbol: "",
              value: additionalInfo.instruct[name]
            }
          }
          commands.push(command);
        } else if (item.action_type === ActionType.alarm) {
          // 触发告警
          action.type = "alarm";
          action.data = {
            warningLevel: item.warning_strategy.warning_level,
            repeatTimes: item.warning_strategy.repeat_count,
            notification: item.warning_strategy.inform_way.split(",")
          };
          actionList.push(action);
        } else if (item.action_type === ActionType.scene) {
          // 激活场景
          action.type = "scene";
          action.value = item.scenario_strategy_id;
          actionList.push(action);
        }
      })
      if (commands.length > 0) {
        actionList.push({ type: "device", data: commands});
      }
      console.log("getActions.actionList", actionList);
      return actionList;
    }
  }
}


</script>

<style scoped>

</style>