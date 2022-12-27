<template>
  <div class="information-container">

        <background-config v-show="formData.type=='background'" :form-data="formData"></background-config>

        <dashboard-config v-show="formData.type == 'dashboard'" :form-data="formData" :cas-options="casOptions"></dashboard-config>

        <curve-config v-show="formData.type == 'curve'" :form-data="formData" :cas-options="casOptions"></curve-config>

        <pie-config v-show="formData.type == 'pie'" :form-data="formData" :cas-options="casOptions"></pie-config>

        <bar-config v-show="formData.type == 'bar'" :form-data="formData" :cas-options="casOptions"></bar-config>

        <text-config v-show="formData.type == 'text'" :form-data="formData" :cas-options="casOptions"></text-config>

        <configure-config v-show="formData.type == 'configure'" :form-data="formData" :cas-options="casOptions"></configure-config>

        <video-config v-show="formData.type == 'video'" :form-data="formData" :cas-options="casOptions"></video-config>

  </div>

</template>

<script>
import bus from "@/core/plugins/eventBus"
import "./components"

export default {
  name: "EditorInformation",
  data() {
    return {
      tabValue: "data",
      formData: {
        type: "background",
        intWidth: 1920,
        intHeight: 1080,
        backgroundColor: "#2d3d86"
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
    });

    // 获取项目/分组/设备的级联菜单
    bus.$on('getCasOptions', val => {
      this.casOptions = val;
    });
  },
  methods: {

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