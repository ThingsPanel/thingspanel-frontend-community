<!-- 文本配置面板 -->
<template>
  <div>
    <el-tabs class="el-dark-tabs" style="" v-model="tabValue">
      <el-tab-pane label="数据" name="data">
        <el-row style="margin: 20px 0 20px 0">
          <el-col :span="6" style="height:100%;padding-top: 6px;color:#fff">名称</el-col>
          <el-col :span="18"><el-input size="mini" v-model="form.name"></el-input></el-col>
        </el-row>

        <el-collapse class="el-dark-collapse information-collapse"  v-model="activeNames">

          <el-collapse-item title="信息" name="info">
            <el-row>
              <el-col :span="6" style="height:100%;padding-top: 6px;color:#fff">文本</el-col>
              <el-col :span="18"><el-input size="mini" v-model="form.value"></el-input></el-col>
            </el-row>
          </el-collapse-item>
          <el-collapse-item title="数据源" name="source">
            <data-source-pane :cas-options="casOptions" :cas-value.sync="form.casValue" :mapping.sync="form.mapping"
              @select="handleSelect"
            ></data-source-pane>
          </el-collapse-item>
        </el-collapse>
      </el-tab-pane>
      <el-tab-pane label="样式" name="style">
        <style-panel></style-panel>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import bus from "@/core/plugins/eventBus"
import DataSourcePane from "./components/DataSourcePane";

export default {
  name: "TextConfig",
  components: { DataSourcePane },
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
      activeNames: ["info", "source"],
      form: {
        name: "",
        text: "",
        mapping: "",
        casValue: "",
        deviceId: ""
      },
      dataSrcOptions: []
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
  },
  methods: {
    handleSelect(v) {
    },
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