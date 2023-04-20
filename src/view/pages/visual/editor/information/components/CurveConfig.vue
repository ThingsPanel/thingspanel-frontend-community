<!-- 曲线图配置面板 -->
<template>
  <div>
    <el-tabs class="el-dark-tabs" style="" v-model="tabValue">
      <el-tab-pane label="配置" name="data">
        <BaseConfig :name="form.name" :z="form.point.z" :w="form.point.w" :h="form.point.h"></BaseConfig>

        <el-collapse class="el-dark-collapse information-collapse" style="padding:10px;" v-model="activeNames">

          <el-collapse-item title="数据源" name="source">
            <data-source-pane :cas-options="casOptions" :data-src.sync="form.dataSrc" :mapping.sync="form.mapping"
                              @select="handleSelect"
            ></data-source-pane>
          </el-collapse-item>

          <el-collapse-item title="采样周期" name="sampling">
            <el-row style="margin: 20px 0 10px 0" :gutter="4">
              <el-col :span="8" style="height:100%;color:#fff" >采样区间:</el-col>
              <el-col :span="6"><el-input style="padding:0;margin-right:4px" size="mini" v-model="samplingTime"></el-input></el-col>
              <el-col :span="10">
                <el-select style="padding:0;" size="mini" v-model="samplingTimeUnit">
                  <el-option label="分钟内" value="minute"></el-option>
                  <el-option label="小时内" value="hour"></el-option>
                  <el-option label="天内" value="day"></el-option>
                </el-select>
              </el-col>
            </el-row>

            <el-row style="margin: 20px 0 10px 0">
              <el-col :span="8" style="height:100%;color:#fff">采样频率:</el-col>
              <el-col :span="16"><el-select style="padding:0" size="mini"></el-select></el-col>
            </el-row>
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
  name: "CurveConfig",
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
      activeNames: ["info", "source", "sampling"],
      form: {
        name: "",
        text: "",
        mapping: "",
        dataSrc: [],
        point: {}
      },
      dataSrcOptions: [],
      samplingTime: 5,
      samplingTimeUnit: "minute",
      sampleFrequency: ""
    }
  },
  watch: {
    formData: {
      handler(newValue){
        if (newValue.type == "curve") {
          this.form = JSON.parse(JSON.stringify(newValue));
        }
      },
      immediate: true
    }
  },
  methods: {
    handleSelect(v, m) {
      this.form.dataSrc = v;
      this.form.mapping = m;
      console.log("====PieConfig.handleSelect", this.form);
      bus.$emit('changeData', this.form);
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