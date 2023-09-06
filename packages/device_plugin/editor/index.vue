<template>
  <div>
    <el-dialog :class="'editor-dialog ' + theme + '-dialog'" :title="$t('PLUGIN.CUSTOM_DEVICE_PLUGIN')" :show-close="false" width="1300px"
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
        <div class="text-right">
          <el-button :disabled="step == 0" type="primary" @click="handlePrev">{{ $t('PLUGIN.PREV') }}</el-button>
          <el-button v-if="step<(steps.length - 1)" type="primary" @click="handleNext">{{ $t('PLUGIN.NEXT') }}</el-button>
          <el-button v-if="step==(steps.length - 1)" :disabled="isSaving" type="primary" @click="handleSave">{{ $t('COMMON.SAVE') }}</el-button>
          <el-button v-if="step==(steps.length - 1)" :disabled="isPublishing" type="primary" @click="handlePublish">{{ $t('PLUGIN.RELEASE') }}</el-button>
          <el-button type="primary" @click="handleClose">{{ $t('PLUGIN.CLOSE') }}</el-button>
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
import {message_error, message_success} from "../../../src/utils/helpers";
import i18n from "@/core/plugins/vue-i18n"

const steps = [
  { label: i18n.t('PLUGIN.DEVICE_INFO'), icon: "el-icon-info", description: i18n.t('PLUGIN.TXT')},
  { label: i18n.t('PLUGIN.THINGS_MODEL'), icon: "el-icon-s-home", description: i18n.t('PLUGIN.TXT1')},
  { label: i18n.t('PLUGIN.CHART'), icon: "el-icon-s-data", description: i18n.t('PLUGIN.TXT2')},
  // { label: i18n.t('PLUGIN.FUNCTION'), icon: "el-icon-edit", description: i18n.t('PLUGIN.TXT3')},
  { label: i18n.t('PLUGIN.RELEASE'), icon: "el-icon-upload", description: i18n.t('PLUGIN.TXT4')}
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
      // default: "自定义设备插件"
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
      isSaving: false,
      isPublishing: false,
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
          message_error("至少绑定一个图表！")
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
    handleSave() {
      this.isSaving = true
      this.$emit("save", this.jsonData, res => {
        if (res.code === 200) {
          message_success(res.msg);
        }
        setTimeout(() => {
          this.isSaving = false;
        }, 3000);
      })
    },
    handlePublish() {
      this.isPublishing = true;
      this.jsonData.publish = { isPus: true };
      this.$emit("publish", this.jsonData, res => {
        if (res.code === 200) {
          message_success(res.msg);
        }
        setTimeout(() => {
          this.isPublishing = false;
        }, 3000);
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
  
}
</style>