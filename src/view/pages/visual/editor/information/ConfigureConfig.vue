<!-- 组态配置面板 -->
<template>
  <div>
    <el-tabs class="el-dark-tabs" style="" v-model="tabValue">
      <el-tab-pane label="配置" name="data">
        <BaseConfig :name="form.name" :z="form.point.z" :w="form.point.w" :h="form.point.h"></BaseConfig>
      </el-tab-pane>
      <el-tab-pane label="样式" name="style">
        <style-panel></style-panel>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import bus from "@/core/plugins/eventBus"
// import StylePanel from "./StylePanel"

export default {
  name: "ConfigureConfig",

  props: {
    formData: {
      type: [Object],
      default: () => { return {} }
    },
    casOptions: {
      type: [Array],
      default: () => []
    }
  },
  data() {
    return {
      tabValue: "data",
      activeNames: ["info"],
      form: {
        name: "",
        text: "",
        mapping: ""
      }
    }
  },
  watch: {
    formData: {
      handler(newValue){
        this.form = JSON.parse(JSON.stringify(newValue));
      }
    },
    form: {
      handler(newValue) {
        bus.$emit('changeData', newValue);
      },
      deep: true
    }
  }
}
</script>

<style scoped>
.el-collapse-item {
  border-top: 1px solid #FFFFFF17;
}
.information-collapse {
  padding: 0!important;
}
::v-deep .el-collapse-item__content {
  padding: 10px 0 20px 14px;
}
.el-select {
  padding: 10px 0 0 0;
}
</style>