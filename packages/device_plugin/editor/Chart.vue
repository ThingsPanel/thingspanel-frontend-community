<template>
  <div class="charts-panel-container">
    <div class="charts-panel-left">
      <el-row>
        <div style="width: 100%;justify-content: space-between;display: flex">
          <el-radio-group v-model="chartCategory">
            <el-radio-button label="dashboard">{{ $t('PLUGIN.CHART_INFO_TAB.DASHBOARD') }}</el-radio-button>
            <el-radio-button label="information">数值/文字/状态</el-radio-button>
            <el-radio-button label="control">{{ $t('PLUGIN.CHART_INFO_TAB.CONTROL') }}</el-radio-button>
            <el-radio-button label="history">统计</el-radio-button>
            <el-radio-button label="video">{{ $t('PLUGIN.CHART_INFO_TAB.VIDEO') }}</el-radio-button>
            <el-radio-button label="report">{{ $t('PLUGIN.CHART_INFO_TAB.REPORT') }}</el-radio-button>
            <el-radio-button label="other">{{ $t('PLUGIN.CHART_INFO_TAB.OTHER') }}</el-radio-button>
          </el-radio-group>
          <el-button style="margin-right: 70px" type="primary" class="btn-order" @click="handleCustom">{{ $t('PLUGIN.CHART_INFO_TAB.CUSTOM') }}</el-button>
        </div>
      </el-row>

      <!-- 表盘 -->
      <dashboard-panel v-if="chartCategory=='dashboard'" ref="dashboard"
                    :charts="options.dashboard" :data-src="dataSrc" @submit="componentSubmit"/>

      <information-panel v-if="chartCategory=='information'" ref="information"
                    :charts="options.information" :data-src="dataSrc" @submit="componentSubmit"/>
      <!-- 历史 -->
      <history-panel v-else-if="chartCategory=='history'" ref="history" :charts="options.history" :data-src="dataSrc"
                     @submit="componentSubmit"/>

      <!-- 控制组件 -->
      <control-panel v-else-if="chartCategory=='control'" ref="control"
                     :controls="options.control" :data-src="dataSrc"
                     @submit="componentSubmit"/>

      <video-panel v-else-if="chartCategory=='video'" ref="video" :charts="options.video"
                   @submit="componentSubmit"
      ></video-panel>

      <report-panel v-else-if="chartCategory=='report'" ref="report" :charts="options.report"/>

      <other-panel v-else-if="chartCategory=='other'" ref="other" :charts="options.other"/>
    
    </div>

    <!-- 已绑定图表 -->
    <div class="charts-panel-right">
      <el-row>
        <el-col>
          <div class="infinite-list-top" style="height: 40px;margin:8px">
            {{ $t('PLUGIN.CHART_INFO_TAB.TEXT') }}
            <el-tooltip class="infinite-list-top-info" effect="dark" :content="$t('PLUGIN.CHART_INFO_TAB.TIP')" placement="right-start">
              <i class="el-icon-info" style="font-size: 18px"></i>
            </el-tooltip>
          </div>
          <div class="infinite-list">
              <div class="infinite-list-item" v-for="(chart, index) in mappedCharts" :key="index">
                <span class="item-binding-chart" @click="handleEditBinding(chart)"> {{ chart.name }} </span>
                <span class="item-binding-chart-close" @click="delBindingChart(chart)"> <i class="el-icon-close"></i> </span>
              </div>
          </div>
        </el-col>
      </el-row>
    </div>

  </div>
</template>

<script>
import DashboardPanel from "../charts/panel/dashboard";
import InformationPanel from "../charts/panel/information"
import HistoryPanel from "../charts/panel/history";
import ReportPanel from "../charts/panel/report"
import VideoPanel from "../charts/panel/video"
import OtherPanel from "../charts/panel/other"
import ControlPanel from "../charts/panel/control";

import { getRandomString } from "../common/util";

export default {
  name: "TpCharts",
  components: {
    DashboardPanel, InformationPanel, HistoryPanel, ControlPanel, ReportPanel, VideoPanel, OtherPanel
  },
  props: {
    data: {
      type: [Array],
      default: () => []
    },
    jsonData: {
      type: [Object],
      default: () => { return {} }
    },
    dataSrc: {
      type: [Array],
      default: () => []
    },
    chartOptions: {
      type: [Object],
      default: () => {return {} }
    }
  },
  data() {
    return {
      theme: "dark",
      chartCategory: "dashboard",
      options: {},
      mappedCharts: [],
      isBinding: "isBinding",
    }
  },
  created() {
    // 导入JSON或编辑插件时,获取JSON文件里已绑定的图表
    if (JSON.stringify(this.chartOptions) != "{}") {
      this.options = JSON.parse(JSON.stringify(this.chartOptions))
    }
    console.log("====chart.created.options", this.options)

    if (this.data) {
      this.mappedCharts = JSON.parse(JSON.stringify(this.data));
    }
  },
  methods: {
    /**
     * 点击右侧已绑定图表
     * @param v
     */
    handleEditBinding(v) {
      this.chartCategory = v.controlType;
      console.log("handleEditBinding", v)
      this.$nextTick(() => {
        this.$refs[v.controlType].showDialog(v);
      })
    },
    /**
     * 删除已绑定图表
     * @param v
     */
    delBindingChart(v) {
      let i = this.mappedCharts.indexOf(v);
      this.mappedCharts.splice(i, 1);
    },
    /**
     * 点击自定义按钮
     */
    handleCustom() {
      if (this.chartCategory == "dashboard") {
        this.$refs.dashboard.handleCustom();
      } else if (this.chartCategory == "history") {

      }
    },
    /**
     *
     * @param option
     */
    componentSubmit(option) {
      if (!option.id) {
        // 新增绑定
        option.id = getRandomString(12);  // 生成id
        this.mappedCharts.push(option);
      } else {
        // 有id，编辑已绑定的图表
        let i = this.mappedCharts.findIndex(item => item.id == option.id)
        this.mappedCharts.splice(i, 1, option)
      }
      console.log("componentSubmit.mappedCharts", this.mappedCharts)
    },
  }
}
</script>

<style scoped>
.charts-panel-container {
  display: flex;
  width: 1300px;
  height: 620px;
  padding: 10px;
}
.charts-panel-left {
}
.charts-panel-right {
  float: right;
  width: 240px;
  margin-left: 10px
}
.infinite-list-top {
  display: flex;
  height: 40px;
  marigin: 8px;
  font-weight: bold;
  align-items: center;
}
.infinite-list-top-info {
  line-height: 40px;
  margin-left: 10px;
}
.infinite-list {
  height: 540px;
  border-radius: 4px;
  /*box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);*/
  border: 1px solid #e7e7e7;
  padding: 20px 6px 20px 10px;
  overflow-y: auto;
}
.infinite-list-item {
  display: flex;
  height: 45px;
  color: #7dbcfc;
  background: #e8f3fe;
  cursor:pointer;
  justify-content: space-between;
  margin-bottom: 10px;
  border-radius: 8px;

}
.item-binding-chart {
  display: flex;
  width: 180px;
  height: 45px;
  justify-content: center;
  align-items: center;
  background: #e8f3fe;
}
.item-binding-chart-close {
  display: flex;
  width: 40px;
  height: 45px;
  font-size: 22px;
  justify-content: center;
  align-items: center;
  margin-left: 10px;
}

.history-form {
  padding: 20px;
}
.history-form .el-form-item {
  margin-bottom: 30px;
  width: 100%;
}
.history-form .el-input {
  width: 100%;
}
::v-deep .history-form .el-form-item__label {
  width: 100px!important;
}
::v-deep .el-checkbox .el-checkbox__label {
  color: #1a1a27!important;
}

.btn-order{
  height: 40px;

}
</style>