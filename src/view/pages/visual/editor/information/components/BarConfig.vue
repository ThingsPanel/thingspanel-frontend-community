<!-- 仪表盘配置面板 -->
<template>
  <div>
    <el-tabs class="el-dark-tabs" style="" v-model="tabValue">
      <el-tab-pane label="配置" name="data">
        <BaseConfig :name.sync="form.name" :z.sync="form.point.z" :w.sync="form.point.w" :h.sync="form.point.h"></BaseConfig>

        <el-collapse class="el-dark-collapse information-collapse" style="padding:10px;" v-model="activeNames">

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
export default {
  name: "BarConfig",
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
        deviceId: "",
        point: { }
      },
      dataSrcOptions: []
    }
  },
  watch: {
    formData: {
      handler(newValue){
        if (newValue.type == "bar") {
          this.form = JSON.parse(JSON.stringify(newValue));
        }
        console.log("====DashboardConfig.form", this.form)
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