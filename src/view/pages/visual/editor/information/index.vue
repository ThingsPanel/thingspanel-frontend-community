<template>
  <div class="information-container">

        <background-config v-show="formData.type=='background'" :form-data="formData"></background-config>

        <dashboard-config v-show="formData.type == 'dashboard'" :form-data="formData" :cas-options="casOptions"></dashboard-config>

        <text-config v-show="formData.type == 'text'" :form-data="formData" :cas-options="casOptions"></text-config>

        <configure-config v-show="formData.type == 'configure'" :form-data="formData" :cas-options="casOptions"></configure-config>

        <video-config v-show="formData.type == 'video'" :form-data="formData" :cas-options="casOptions"></video-config>

  </div>

</template>

<script>
import bus from "@/core/plugins/eventBus"
// import StylePanel from "./style"
import PluginAPI from "@/api/plugin"
import BackgroundConfig from "./BackgroundConfig";
import DashboardConfig from "./DashboardConfig";
import TextConfig from "./TextConfig"
import ConfigureConfig from "./ConfigureConfig"
import VideoConfig from "./VideoConfig";
export default {
  name: "EditorInformation",
  components: { BackgroundConfig, DashboardConfig, TextConfig, ConfigureConfig, VideoConfig },
  data() {
    return {
      tabValue: "data",
      formData: {
        name: "",
        text: "",
        mapping: ""
      },
      casOptions: [],
      dataSrcOptions: []
    }
  },
  mounted() {
    // 监听share事件
    bus.$on('share', val => {
      this.formData = JSON.parse(JSON.stringify(val));
      if (!this.formData.mapping) this.formData.mapping = "";
      console.log("====share.formData", this.formData)
    });

    // 获取项目/分组/设备的级联菜单
    bus.$on('getCasOptions', val => {
      this.casOptions = val;
    });
  },
  methods: {
    handleTabClick() {

    },
  }
}
</script>

<style scoped>
.information-container {
  width: 100%;
  height: 100%;
  padding: 16px;
}
::v-deep .el-divider--horizontal {
 margin-top: 44px!important;
}
.el-cascader {
  margin-bottom: 10px!important;
}
</style>