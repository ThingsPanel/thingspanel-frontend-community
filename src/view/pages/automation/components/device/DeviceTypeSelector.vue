<template>
  <div style="width: 100%;display: flex">
    <!-- 项目列表 -->
    <el-select :no-data-text="$t('COMMON.SELECT_NO_DATA')" ref="projectRef" style="width: 16%;min-width: 100px;margin-right:10px" v-model="formData.projectId"
      filterable :placeholder="$t('AUTOMATION.PLACEHOLDER.SELECT_PROJECT')" @change="handleProjectChange">
      <el-option v-for="(option, index) in projectOptions" :key="index" :label="option.name"
        :value="option.id"></el-option>
    </el-select>

    <!-- 分组列表 -->
    <el-select :no-data-text="$t('COMMON.SELECT_NO_DATA')" ref="groupRef" style="min-width: 100px;width:16%;margin-right:10px" v-if="formData.projectId"
      v-model="formData.groupId" :placeholder="$t('AUTOMATION.PLACEHOLDER.SELECT_GROUP')" @change="handleGroupChange">
      <el-option v-for="(option, index) in groupOptions" :key="index" :label="option.device_group"
        :value="option.id"></el-option>
    </el-select>

    <!-- 设备列表 -->
    <!-- <el-select ref="deviceRef" style="width: 100px;margin-right:10px" v-if="formData.groupId" v-model="formData.device" :placeholder="$t('AUTOMATION.PLACEHOLDER.SELECT_DEVICE')"
               @change="handleDeviceChange">
      <el-option v-for="(option, index) in deviceOptions" :key="index" :label="option.label" :value="option"></el-option>
    </el-select> -->

    <!-- 设备列表 -->
    <el-cascader ref="deviceRef" style="min-width: 100px;width:16%;margin-right:10px" v-if="formData.groupId"
      v-model="formData.device" :placeholder="$t('AUTOMATION.PLACEHOLDER.SELECT_DEVICE')" :options="deviceOptions"
      clearable :props="{ checkStrictly: true, emitPath: false }" @change="handleDeviceChange">
      <template slot-scope="{ node, data }">
        <span>{{ data.label }}</span>
        <span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>
      </template>
    </el-cascader>

    <!-- 状态/属性列表 -->
    <el-select :no-data-text="$t('COMMON.SELECT_NO_DATA')" ref="stateRef" style="min-width: 100px;width:16%;margin-right:10px" v-if="formData.device"
      v-model="formData.state" value-key="name" :placeholder="$t('AUTOMATION.PLACEHOLDER.SELECT_STATE')"
      @change="handleStateChange">
      <el-option-group v-for="group in stateOptions" :key="group.label" :label="group.label">
        <el-option v-for="item in group.options" :key="item.name"
          :label="item.label + (item.readWrite === 'r' ? ' (只读)' : '')" :value="item"
          :disabled="item.readWrite === 'r' && !option.operator">
        </el-option>
      </el-option-group>
    </el-select>

    <template v-if="formData.state">
      <!-- 在线持续时间 -->
      <OnlineDuration style="width: 24%" ref="onlineDurationRef" v-if="formData.state.mode == 'onlineDuration'"
        :data="formData.state.duration" @change="handleDurationChange" />

      <!-- 操作符 -->
      <OperatorSelector style="width: 280px" ref="operatorSelectorRef" v-else-if="formData.state.mode == 'property'"
        :chart="chartData" :data="formData.state" :option="option" @change="handleOperatorChange" />

      <el-input style="width:20%;" ref="eventRef" v-else-if="formData.state.mode === 'event'"
        v-model="formData.state.params" @change="handleChangeState" />
      <el-input style="width:20%;" ref="commandRef" v-else-if="formData.state.mode === 'command'"
        v-model="formData.state.params" @change="handleChangeState" />
      <el-input style="width:20%;" ref="customRef" v-else-if="formData.state.mode === 'custom'"
        v-model="formData.state.params" @change="handleChangeState" />
    </template>

  </div>
</template>

<script>
import { business_index } from "@/api/business";
import { device_group_drop } from "@/api/asset";
import { getDeviceTree } from "@/api/device";
import PluginAPI from "@/api/plugin";
import OnlineDuration from "./OnlineDuration"
import OperatorSelector from "./OperatorSelector";
import { message_error } from '@/utils/helpers';
import i18n from "@/core/plugins/vue-i18n"
export default {
  name: "DeviceTypeSelector",
  components: { OnlineDuration, OperatorSelector },
  props: {
    /**
     * 配置
     * mode: condition 条件; action 操作
     */
    option: {
      type: [Object],
      default: () => { return { mode: "condition", operator: true } }
    },
    data: {
      type: [Object],
      default: () => { return {} }
    }
  },
  data() {
    return {
      formData: {
        projectId: "",
        groupId: "",
        deviceId: "",
        device: {},
        state: {
          duration: {},
          operator: {
            symbol: "",
            value: ""
          }
        }
      },
      // 项目列表
      projectOptions: [],
      // 分组列表
      groupOptions: [],
      // 设备列表
      deviceOptions: [],
      // 状态/属性列表
      stateOptions: [],
      chartList: [],
      chartData: {},
      eventList: [],
      commandList: []
    }
  },
  watch: {
    data: {
      handler(newValue) {
        if (newValue) {
          this.formData = JSON.parse(JSON.stringify(newValue));
        }
      },
      immediate: true
    },
    "formData.projectId": {
      handler(newValue) {
        if (newValue) {
          this.getGroupList(newValue);
        }
      },
      immediate: true
    },
    "formData.groupId": {
      handler(newValue) {
        if (newValue) {
          this.getDeviceList(newValue);
        }
      },
      immediate: true
    }
  },
  created() {
    // 初始化项目列表
    this.getProjectList();
  },
  methods: {
    /**
     * 选择项目
     * @param v
     */
    handleProjectChange(v) {
      this.formData.projectId = v;
      this.formData.groupId = "";
      this.updateData();
      this.getGroupList(v);
    },
    /**
     * 选择分组
     * @param v
     */
    handleGroupChange(v) {
      this.formData.groupId = v;
      this.formData.deviceId = "";
      this.updateData();
      this.getDeviceList(v);
    },
    /**
     * 选择设备
     * @param v
     */
    handleDeviceChange(v) {
      const deviceRef = this.$refs.deviceRef;
      const { data } = deviceRef.getCheckedNodes()[0];
      this.formData.deviceId = data.value;
      this.updateData();
      this.getStateList(data.pluginId);
    },
    /**
     * 选择状态或属性
     * @param v
     */
    handleStateChange(v) {
      if (v && v.mode === "onlineState") {
        this.formData.state = { ...v };
      } else if (v && v.mode === "property") {
        this.formData.state = { ...v };
        if (v.readWrite && v.readWrite === "rw") {
          this.chartData = { type: "", controlType: "control" }
          this.chartList.forEach(item => {
            if (item.controlType === "control") {
              let map = item.series[0].mapping;
              if (map && map.value === v.name) {
                this.chartData = item;
              }
            }
          });
        } else {
          this.chartData = { type: "", controlType: "" }
        }
      } else if (v && v.mode === "command") {
        this.formData.state = this.commandList.find(item => {
          return item.name === v.name;
        })
      } else if (v && v.mode === "event") {
        this.formData.state = this.eventList.find(item => {
          return item.name === v.name;
        })
      } else if (v && v.mode === "custom") {
        this.formData.state = { ...v };
      }

      this.updateData();
    },
    /**
     * 改变在线持续时间
     * @param {*} v 
     */
    handleDurationChange(v) {
      this.formData.state.duration = v;
      this.updateData();
    },
    /**
     * 改变操作符和值
     * @param v
     */
    handleOperatorChange(v) {
      this.formData.state.operator = v;
      this.updateData();
    },
    handleChangeState(v) {
      // this.formData.state
      this.updateData();
    },
    /**
     * 向父组件传值
     */
    updateData() {
      this.$emit("change", this.formData);
    },
    /**
     * 获取项目列表
     */
    getProjectList() {
      business_index({ limit: 9999, page: 1 })
        .then(({ data }) => {
          if (data.code == 200) {
            this.projectOptions = data.data?.data || [];
          }
        })
    },
    /**
     * 获取设备分组
     * @param id  项目id
     */
    getGroupList(id) {
      device_group_drop({ business_id: id })
        .then(({ data }) => {
          if (data.code == 200) {
            this.groupOptions = data?.data || [];
          }
        })
    },
    /**
     * 获取设备列表
     * @param id  分组id
     */
    getDeviceList(id) {
      const params = { current_page: 1, per_page: 9999, asset_id: id }
      getDeviceTree(params)
        .then(({ data }) => {
          if (data.code == 200) {
            let arr = data.data?.data || [];

            this.deviceOptions = arr.map(item => {
              if (item.children && item.children.length > 0) {
                item.children = item.children.map(child => {
                  return {
                    label: child.device_name, value: child.device, pluginId: child.type
                  }
                })
              }
              return {
                label: item.device_name,
                value: item.device,
                pluginId: item.type,
                children: item.children || undefined
              }
            });

            if (this.formData.deviceId) {
              this.formData.device = [];
              let pluginId = null;
              const deviceObj = this.deviceOptions.find(item => {
                if (item.children && item.children.length > 0) {
                  return item.children.find(child => {
                    if (child.value == this.formData.deviceId) {
                      pluginId = child.pluginId;
                      this.formData.device.push(item.value);
                      this.formData.device.push(child.value);
                      return true;
                    }
                  })
                }
                if (item.value == this.formData.deviceId) {
                  pluginId = item.pluginId;
                  this.formData.device.push(item.value);
                  return true;
                }
              });


              this.getStateList(pluginId);
              this.updateData();
            }
          }
        })
    },
    /**
     * 获取状态和属性列表
     * @param id  插件id
     */
    getStateList(id) {
      this.stateOptions = [];
      if (this.option.mode === "condition") {
        // 在线状态
        this.stateOptions.push({
          label: this.$t('AUTOMATION.ONLINE_OFFLINE'),
          mode: "onlineState",
          options: [
            { mode: "onlineState", label: this.$t('AUTOMATION.ONLINE'), name: "online" },
            { mode: "onlineState", label: this.$t('AUTOMATION.OFFLINE'), name: "offline" },
            { mode: "onlineState", label: this.$t('AUTOMATION.ONLINE_OFFLINE'), name: "onAndOff" }
          ]
        });
      }
      if (!id) {
        this.updateData();
        return;
      }
      let params = { current_page: 1, per_page: 9999, id };
      PluginAPI.page(params)
        .then(({ data }) => {
          if (data.code == 200) {
            const jsonStr = data.data?.data[0]?.chart_data || "{}";
            let jsonObj = JSON.parse(jsonStr);

            // 物模型属性
            const { tsl, chart } = jsonObj;
            let properties = tsl.properties || [];
            let services = tsl.services || [];
            let events = tsl.events || [];
            this.chartList = chart;
            let currentItem = undefined;
            this.formData.state = {};

            // 属性
            let arr = properties.map(item => {
              if (this.formData.state && this.formData.state.name === item.name) {
                this.formData.state = { ...this.formData.state, unit: item.unit, type: item.type, readWrite: item.readWrite || "r" }
              }
              return { label: item.title, name: item.name, unit: item.unit, mode: "property", type: item.dataType, readWrite: item.readWrite || "r" };
            });
            this.stateOptions.push({
              label: this.option.operator ? this.$t('AUTOMATION.PROPERTY') : "设定值",
              mode: "property",
              options: arr
            });
            if (this.option.mode === "action") {
              // 命令标识符
              let serviceArr = services.map(service => {
                let params = {};
                service.commandParams.forEach(item => {
                  params[item.identifier] = ""
                })
                return {
                  label: service.commandName, name: service.commandId, mode: "command", params: JSON.stringify(params)
                };
              })
              this.commandList = serviceArr;
              serviceArr.length && this.stateOptions.push({ label: "命令标识符", mode: "command", options: serviceArr })
              
              if (this.option.mode !== "action") {
                // 自定义属性下发
                this.stateOptions.push({
                  label: "其他", options: [
                    { label: "自定义属性", name: "custom", mode: "custom" }
                  ]
                })
              }
              
            } else if (this.option.mode === "condition") {
              // 事件标识符
              let eventArr = events.map(event => {
                let params = {};
                event.eventParams.forEach(item => {
                  params[item.identifier] = "";
                })
                return {
                  label: event.eventName, name: event.eventId, mode: "event", params: JSON.stringify(params)
                }
              })
              this.eventList = eventArr;
              eventArr.length && this.stateOptions.push({ label: "事件标识符", mode: "event", options: eventArr })
            }

            for (let index = 0; index < this.stateOptions.length; index++) {
              const item = this.stateOptions[index];
              let state = JSON.parse(this.data.stateJSON);
              if (state) {
                currentItem = item.options.find(it => it.name === state.name)
                if (currentItem) break;
              }
            }
            let state = JSON.parse(this.data.stateJSON);
            const stateOption = this.stateOptions.find(item => {
              return item.mode === state.mode;
            })
            if (stateOption && stateOption.options.length > 0) {
              currentItem = stateOption.options.find(item => item.name === state.name)
            }

            if (state && state.mode === "onlineState") {
            } else if (state && state.mode === "property") {
              currentItem.operator = state.operator;
            } else if (state && state.mode === "event") {
              currentItem.params = state.params;
            } else if (state && state.mode === "command") {
              currentItem.params = state.params;
            } else if (state && state.mode === "custom") {
              currentItem = {
                name: "custom",
                ...state
              }
            }

            this.handleStateChange(currentItem);
            this.updateData();
          }
        })
    },
    /**
     * @description: 验证
     * @return {*}
     */
    validate() {

      const refs = this.$refs;
      const form = this.formData;

      try {
        if (!form.projectId || form.projectId === "") {
          refs.projectRef.focus();
          throw new Error(this.$t('AUTOMATION.ERROR.PROJECT'));
        }
        if (!form.groupId || form.groupId === "") {
          refs.groupRef.focus();
          throw new Error(this.$t('AUTOMATION.ERROR.GROUP'));
        }
        if (!form.deviceId || form.deviceId === "") {
          refs.deviceRef.focus();
          throw new Error(this.$t('AUTOMATION.ERROR.DEVICE'));
        }
        if (!form.state || form.state === "" || JSON.stringify(form.state) === "{}") {
          refs.stateRef.focus();
          throw new Error(this.$t('AUTOMATION.ERROR.STATE'));
        }
        if (refs.onlineDurationRef && !refs.onlineDurationRef.validate()) return false;
        if (refs.operatorSelectorRef && !refs.operatorSelectorRef.validate()) return false;

        if (form.state.mode === "event" && !form.state.params) {
          refs.eventRef.focus();
          throw new Error("请输入正确的事件");
        }
        
        if (form.state.mode === "command" && !form.state.params) {
          refs.commandRef.focus();
          throw new Error("请输入正确的命令");
        }
        if (form.state.mode === "custom" && !form.state.params) {
          refs.customRef.focus();
          throw new Error("请输入正确的属性");
        }
      } catch(err) {
        message_error(err.message);
        return false;
      }
      return true;
    }
  }
}
</script>

<style scoped></style>