<template>
  <div>
    <el-dialog :class="'editor-dialog ' + theme + '-dialog'" :title="title" :show-close="false" width="1300px"
               :visible="visible" :append-to-body="true"
               :close-on-click-modal="false">
      <el-steps style="margin: 20px auto;"
          :active="step" finish-status="success"  >
        <el-step v-for="(item, index) in steps" :key="index" :title="item.label"  :icon="item.icon" :description="item.description"></el-step>

      </el-steps>
<!--      <el-divider></el-divider>-->

      <Information v-if="step == 0" ref="information" :data="jsonData.info" :pluginCategory="pluginCategory"></Information>

      <TSL v-if="step == 1" ref="tsl" :table-attr="tableAttr" :data="jsonData.tsl"></TSL>

      <Chart v-if="step == 2" ref="chart"
             :chart-options="chartOptions"
             :data="jsonData.chart"
             :data-src="jsonData.tsl.properties"></Chart>

      <!-- <Function v-if="step == 3"></Function>-->

      <Publish v-if="step == 3" ref="publish" :data="jsonData"></Publish>

      <div slot="footer" class="dialog-footer" >
        <el-button type="primary" @click="handleClose">关闭</el-button>
        <div>
          <el-button :disabled="step == 0" type="primary" @click="handlePrev">上一步</el-button>
          <el-button v-if="step<(steps.length - 1)" type="primary" @click="handleNext">下一步</el-button>
          <el-button v-if="step==(steps.length - 1)"  type="primary" @click="handlePublish">发布</el-button>
        </div>
      </div>
    </el-dialog>
  </div>

</template>

<script>
import Information from "./Information"
import TSL from "./TSL"
import Chart from "./Chart"
import options from "../charts/options/options.json"
import attrs from "../data/attrs";
import global from "../common/global";

// import Function from "./Function"
import Publish from "./Publish";
const steps = [
  { label: "插件信息", icon: "el-icon-info", description: "填写插件信息" },
  { label: "物模型", icon: "el-icon-s-home", description: "选择标准物模型或自定义" },
  { label: "图表", icon: "el-icon-s-data", description: "绑定图表" },
  // { label: "函数", icon: "el-icon-edit", description: "Function" },
  { label: "发布", icon: "el-icon-upload", description: "发布到应用商店" }
]


// const required = true, only = true, advanced = true, filterable = true;
export default {
  name: "DevicePluginEditor",
  components: {
    Information, TSL, Chart, Publish
  },
  props: {
    /**
     * 主题 light/dark
     */
    theme: {
      type: [String],
      default: "dark"
    },
    title: {
      type: [String],
      default: "自定义设备插件"
    },
    json: {
      type: [Object],
      default: () => { return {info:{}, tsl:{}} }
    },
    /**
     * 显示/隐藏
     */
    visible: {
      type: [String, Boolean],
      default: false
    },
    pluginCategory: {
      type:  [Array],
      default: () => []
    },
    /**
     * 图表库
     */
    chartOptions: {
      type: [Object],
      default: () => { return options }
    },
    /**
     * 表格/表单的字段属性
     */
    tableAttr: {
      type: [Object],
      default: () => {
        return attrs.tableAttr;
      }
    }
  },
  watch: {
    theme: {
      handler(newValue) {
        global.theme = newValue;
        console.log("====index", global.theme)
      },
      immediate: true
    },
    visible: {
      handler(newValue) {
        this.init();
        this.dialogVisible = newValue;
      },
      immediate: true
    }
  },
  data() {
    return {
      dialogVisible: false,
      steps,
      publishing: false,
      step: 0,
      jsonData: {
        info: {
          pluginName: "测试1"
        },
        tsl: {}
      },
    }
  },
  methods: {
    init() {
      this.step = 0;
      this.jsonData = JSON.parse(JSON.stringify(this.json));
    },
    handlePrev() {
      this.step--;
    },
    handleNext() {
      if (this.step == 0) {
        // 插件信息
        if (!this.$refs.information.chkValue()) {
          return;
        }
        this.jsonData.info = this.$refs.information.formData;
      } else if (this.step == 1) {
        // 物模型
        if (!this.$refs.tsl.chkValue()) {
          return;
        }
        let tsl = this.$refs.tsl;
        if (tsl.radioClassify == "standard") {
          // 标准物模型
          this.jsonData.tsl = tsl.standardData;
          this.jsonData.tsl.option = { classify: "standard", tslValue: tsl.tslValue};
        } else {
          // 自定义物模型
          this.jsonData.tsl = tsl.customData;
          this.jsonData.tsl.option = { classify: "custom", catValue: tsl.categoryValue};
        }
      } else if (this.step == 2) {
        // 图表
        this.jsonData.chart = this.$refs.chart.mappedCharts;
        if (this.jsonData.chart.length == 0) {
          return;
        }
      } else if (this.step == 3) {
        // 发布
      }
      this.step++
    },
    handleClose() {
      this.$emit("update:visible", false);
    },
    handlePublish() {
      this.publishing = true;
      this.jsonData["publish"] = {};
      this.jsonData["publish"]["isPub"] = this.$refs.publish.isPublic;
      this.$emit("publish", this.jsonData, (res) => {
        if (res) {
          this.publishing =false;
          this.$emit("update:visible", false);
        }
      });
    }

  }
}
</script>

<style scoped>
::v-deep .el-dialog__body {
  padding-top: 0;
}
.dialog-footer {
  display: flex;
  justify-content: space-between;
}
</style>