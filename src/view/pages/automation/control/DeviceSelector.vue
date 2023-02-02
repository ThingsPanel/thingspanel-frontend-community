<template>
  <div style="display: flex">
    <el-select style="width: 100px;margin-right:10px" v-model="formData.projectId"
               @change="handleProjectChange">
      <el-option v-for="(option, index) in projectOptions" :key="index" :label="option.name" :value="option.id"></el-option>
    </el-select>
    <!-- 选择项目后显示分组 -->
<!--    <GroupSelector v-if="formData.project.id" :data.sync.once="formData.project"/>-->

    <el-select style="width: 100px;margin-right:10px" v-if="formData.projectId" v-model="formData.groupId"
               @change="handleGroupChange">
      <el-option v-for="(option, index) in groupOptions" :key="index" :label="option.device_group" :value="option.id"></el-option>
    </el-select>

    <el-select style="width: 100px;margin-right:10px" v-if="formData.groupId" v-model="formData.device"
               @change="handleDeviceChange">
      <el-option v-for="(option, index) in deviceOptions" :key="index" :label="option.label" :value="option"></el-option>
    </el-select>


  </div>
</template>

<script>
import { business_index } from "@/api/business";
import {device_group_drop} from "@/api/asset";
import {getDeviceTree} from "@/api/device";

export default {
  name: "DeviceSelector",
  data() {
    return {
      formData: {},
      projectOptions: [],
      groupOptions: [],
      deviceOptions: [],
      params: {}
    }
  },
  created() {
    this.getProjectList();
  },
  methods: {
    handleProjectChange(v) {
      this.params.projectId = v;
      this.updateData();
      this.getGroupList(v);
    },
    handleGroupChange(v) {
      this.params.groupId = v;
      this.updateData();
      this.getDeviceList(v);
    },
    handleDeviceChange(v) {
      this.params.deviceId = v;
      this.updateData();
    },
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
  }
}
</script>

<style scoped>

</style>