<template>
  <div style="display: flex">
    <!-- 项目列表 -->
    <el-select ref="projectRef" style="width: 100px;margin-right:10px" v-model="formData.projectId" :placeholder="$t('AUTOMATION.PLACEHOLDER.SELECT_PROJECT')"
               @change="handleProjectChange">
      <el-option v-for="(option, index) in projectOptions" :key="index" :label="option.name" :value="option.id"></el-option>
    </el-select>

    <!-- 分组列表 -->
    <el-select ref="groupRef" style="width: 100px;margin-right:10px" v-if="formData.projectId" v-model="formData.groupId" :placeholder="$t('AUTOMATION.PLACEHOLDER.SELECT_GROUP')"
               @change="handleGroupChange">
      <el-option v-for="(option, index) in groupOptions" :key="index" :label="option.device_group" :value="option.id"></el-option>
    </el-select>

    <!-- 设备列表 -->
    <!-- <el-select ref="deviceRef" style="width: 100px;margin-right:10px" v-if="formData.groupId" v-model="formData.device" :placeholder="$t('AUTOMATION.PLACEHOLDER.SELECT_DEVICE')"
               @change="handleDeviceChange">
      <el-option v-for="(option, index) in deviceOptions" :key="index" :label="option.label" :value="option"></el-option>
    </el-select> -->

    <!-- 设备列表 -->
    <el-cascader ref="deviceRef" style="width: 100px;margin-right:10px" v-if="formData.groupId" v-model="formData.device" :placeholder="$t('AUTOMATION.PLACEHOLDER.SELECT_DEVICE')"
      :options="deviceOptions" clearable :props="{ checkStrictly: true, emitPath: false }"
       @change="handleDeviceChange">
       <template slot-scope="{ node, data }">
        <span>{{ data.label }}</span>
        <span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>
      </template>
    </el-cascader>

   
    <!-- 消息类型列表 -->
    <el-select ref="stateRef" style="width: 100px;margin-right:10px"  v-if="formData.device"  v-model="formData.messageType" 
               @change="handleStateChange">
      <el-option v-for="(option, index) in stateOptions" :key="index" :label="option.name" :value="option.messageType"></el-option>
    </el-select>
     <!-- 状态/属性列表 -->
    <!-- <el-select ref="stateRef" style="width: 100px;margin-right:10px" v-if="formData.device" 
               v-model="formData.state" value-key="name" :placeholder="$t('AUTOMATION.PLACEHOLDER.SELECT_STATE')"
               @change="handleStateChange">
      <el-option-group v-for="group in stateOptions" :key="group.label" :label="group.label">
        <el-option v-for="item in group.options" :key="item.name" :label="item.label" :value="item"></el-option>
      </el-option-group>
    </el-select> -->

   

  </div>
</template>

<script>
import { business_index } from "@/api/business";
import {device_group_drop} from "@/api/asset";
import {getDeviceTree} from "@/api/device";
import PluginAPI from "@/api/plugin";

import { message_error } from '@/utils/helpers';
import i18n from "@/core/plugins/vue-i18n"
export default {
  name: "DeviceTypeSelector",
  components: { },
  props: {
    /**
     * 配置
     */
    option: {
      type: [Object],
      default: () => { return { operator: true } }
    },
    data: {
      type: [Object],
      default: () => {return {}}
    }
  },
  data() {
    return {
      formData: {
        projectId: "",
        groupId: "",
        deviceId: "",
        device: "",
        messageType:"",
        // state: {
        //   duration: {},
        //   operator: {
        //     symbol: "",
        //     value: ""
        //   }
        // }
      },
      // 项目列表
      projectOptions: [],
      // 分组列表
      groupOptions: [],
      // 设备列表
      deviceOptions: [],
      // 状态/属性列表
      stateOptions: [
        {
          name:"属性上报",
          messageType:1,
        },
        {
          name:"属性下发",
          messageType:2,
        },
        {
          name:"事件上报",
          messageType:3,
        },
        {
          name:"自定义上报",
          messageType:4,
        },
      ]
    }
  },
  watch: {
    data: {
      handler(newValue) {
        console.log("data", newValue)
        if (newValue) {
          this.formData = JSON.parse(JSON.stringify(newValue));
          console.log("formData", this.formData)
          
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
          console.log("formData.groupId", newValue)
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
      console.log("handleGroupChange", v)
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
      console.log("handleDeviceChange.device", this.formData.device)
      this.formData.deviceId = data.value;
      this.updateData();
      // this.getStateList(data.pluginId);
    },
    /**
     * 选择状态或属性
     * @param v
     */
    handleStateChange(v) {
      this.formData.state = v;
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
    /**
     * 向父组件传值
     */
    updateData() {
      console.log("updateData", this.formData);
      this.$emit("change", this.formData);
    },
    /**
     * 获取项目列表
     */
    getProjectList() {
      business_index({limit: 100, page: 1})
          .then(({data}) => {
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
      device_group_drop({business_id: id})
          .then(({data}) => {
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
      const params = {current_page: 1, per_page: 9999, asset_id: id}
      getDeviceTree(params)
          .then(({data}) => {
            console.log(data,'res')
            if (data.code == 200) {
              let arr = data.data?.data || [];

              this.deviceOptions = arr.map(item => {
                return {
                  label: item.device_name, value: item.device, pluginId: item.type
                }
              });
              
              if (this.formData.deviceId) {
                this.formData.device = this.deviceOptions.find(item => item.value == this.formData.deviceId);
                // this.formData.device && this.getStateList(this.formData.device.pluginId);
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
      console.log("getStateList", id)
      this.stateOptions = [];
      if (this.option.operator) {
        this.stateOptions.push({
          label: this.$t('AUTOMATION.ONLINE_STATUS'), 
          options: [
            { mode: "onlineDuration", label: this.$t('AUTOMATION.ONLINE_DURATION'), name: "onlineDuration" },
          ]
        });

        this.stateOptions.push({
          label: this.$t('AUTOMATION.ONLINE_OFFLINE'), 
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
      let params = {current_page: 1, per_page: 9999, id };
      PluginAPI.page(params)
          .then(({data}) => {
            if (data.code == 200) {
              const jsonStr = data.data?.data[0]?.chart_data || "{}";
              let jsonObj = JSON.parse(jsonStr);

              // 物模型属性
              let properties = jsonObj.tsl?.properties || [];

              let arr = properties.map(item => {
                if (this.formData.state && this.formData.state.name === item.name) {
                  this.formData.state = { ...this.formData.state, unit: item.unit, type: item.type }
                }
                return { label: item.title, name: item.name, unit: item.unit, mode: "property", type: item.dataType };
              });

              
              this.stateOptions.push({label: this.$t('AUTOMATION.PROPERTY'), options: arr});

              console.log(this.stateOptions)
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
      if (!form.projectId || form.projectId === "") {
        refs.projectRef.focus();
        message_error(this.$t('AUTOMATION.ERROR.PROJECT'));
        return false;
      }
      if (!form.groupId || form.groupId === "") {
        refs.groupRef.focus();
        message_error(this.$t('AUTOMATION.ERROR.GROUP'));
        return false;
      }
      if (!form.device || form.device === "") {
        refs.deviceRef.focus();
        message_error(this.$t('AUTOMATION.ERROR.DEVICE'));
        return false;
      }
      if (!form.messageType || form.messageType === "") {
        refs.stateRef.focus();
        message_error(this.$t('AUTOMATION.ERROR.MESSAGETYPE'));
        return false;
      }
      if (refs.onlineDurationRef && !refs.onlineDurationRef.validate()) return false;
      if (refs.operatorSelectorRef && !refs.operatorSelectorRef.validate()) return false;
      return true;
    }
  }
}
</script>

<style scoped>

</style>