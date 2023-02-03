<template>
  <div style="display: flex">
    <!-- 项目列表 -->
    <el-select style="width: 100px;margin-right:10px" v-model="formData.projectId"
               @change="handleProjectChange">
      <el-option v-for="(option, index) in projectOptions" :key="index" :label="option.name" :value="option.id"></el-option>
    </el-select>
    <!-- 选择项目后显示分组 -->
<!--    <GroupSelector v-if="formData.project.id" :data.sync.once="formData.project"/>-->

    <!-- 分组列表 -->
    <el-select style="width: 100px;margin-right:10px" v-if="formData.projectId" v-model="formData.groupId"
               @change="handleGroupChange">
      <el-option v-for="(option, index) in groupOptions" :key="index" :label="option.device_group" :value="option.id"></el-option>
    </el-select>

    <!-- 设备列表 -->
    <el-select style="width: 100px;margin-right:10px" v-if="formData.groupId" v-model="formData.device"
               @change="handleDeviceChange">
      <el-option v-for="(option, index) in deviceOptions" :key="index" :label="option.label" :value="option"></el-option>
    </el-select>

    <!-- 状态/属性列表 -->
    <el-select style="width: 100px;margin-right:10px" v-if="formData.device && formData.device.value" v-model="formData.state" value-key="name"
               @change="handleStateChange">
      <el-option-group v-for="group in stateOptions" :key="group.label" :label="group.label">
        <el-option v-for="item in group.options" :key="item.name" :label="item.label" :value="item"></el-option>
      </el-option-group>
    </el-select>

    <template v-if="formData.state">
      <!-- 在线持续时间 -->
      <OnlineDuration v-if="formData.state.mode=='onlineDuration'" @change="handleDurationChange"/>

      <!-- 操作符 -->
      <OperatorSelector v-else-if="formData.state.mode == 'property'"
                        :data="formData.state" :option="option" @change="handleOperatorChange"/>
    </template>

  </div>
</template>

<script>
import { business_index } from "@/api/business";
import {device_group_drop} from "@/api/asset";
import {getDeviceTree} from "@/api/device";
import PluginAPI from "@/api/plugin";
import OnlineDuration from "./OnlineDuration"
import OperatorSelector from "./OperatorSelector";
export default {
  name: "DeviceTypeSelector",
  components: { OnlineDuration, OperatorSelector },
  props: {
    /**
     * 配置
     */
    option: {
      type: [Object],
      default: () => { return { operator: true } }
    }
  },
  data() {
    return {
      formData: {},
      // 项目列表
      projectOptions: [],
      // 分组列表
      groupOptions: [],
      // 设备列表
      deviceOptions: [],
      // 状态/属性列表
      stateOptions: [],
      // 向父组件传的值
      params: {
        projectId: "",
        groupID: "",
        deviceId: "",
        state: {
          duration: {},
          operator: {
            symbol: "",
            value: ""
          }
        }
      }
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
      this.params.projectId = v;
      this.updateData();
      this.getGroupList(v);
    },
    /**
     * 选择分组
     * @param v
     */
    handleGroupChange(v) {
      this.params.groupId = v;
      this.updateData();
      this.getDeviceList(v);
    },
    /**
     * 选择设备
     * @param v
     */
    handleDeviceChange(v) {
      this.params.deviceId = v.value;
      this.updateData();
      this.getStateList(v.pluginId);
    },
    /**
     * 选择状态或属性
     * @param v
     */
    handleStateChange(v) {
      this.params.state = v;
      this.updateData();
    },
    /**
     * 改变在线持续时间
     * @param {*} v 
     */
    handleDurationChange(v) {
      this.params.state.duration = { value: v };
      this.updateData();
    },
    /**
     * 改变操作符和值
     * @param v
     */
    handleOperatorChange(v) {
      this.params.state.operator = v;
      this.updateData();
    },
    /**
     * 向父组件传值
     */
    updateData() {
      this.$emit("update:data", this.params);
      this.$emit("change", this.params);
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
            if (data.code == 200) {
              let arr = data.data?.data || [];
              this.deviceOptions = arr.map(item => {
                return {
                  label: item.device_name, value: item.device, pluginId: item.type
                }
              });
              console.log("====getDeviceList", this.deviceOptions)
            }
          })
    },
    /**
     * 获取状态和属性列表
     * @param id  插件id
     */
    getStateList(id) {
      console.log("====getStateList", id)
      let params = {current_page: 1, per_page: 10, id };
      PluginAPI.page(params)
          .then(({data}) => {
            if (data.code == 200) {
              const jsonStr = data.data?.data[0].chart_data || "{}";
              let jsonObj = JSON.parse(jsonStr);
              // 物模型属性
              let properties = jsonObj.tsl?.properties || [];
              let arr = properties.map(item => {
                return { label: item.title, name: item.name, unit: item.unit, mode: "property" };
              });
              this.stateOptions = [];
              if (this.option.operator) {
                this.stateOptions.push({label: "状态", options: [{ mode: "onlineDuration", label: "在线状态", name: "onlineDuration" }]});
              }
              this.stateOptions.push({label: "属性", options: arr});
              console.log("====getStateList", this.stateOptions);
            }
          })
    }
  }
}
</script>

<style scoped>

</style>