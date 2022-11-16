<template>
  <div class="editor-container">
    <div class="search-box">
        <span style="width: 60px;color: #fff;">组件:</span>
        <el-input class="el-dark-input" suffix-icon="el-icon-search" placeholder="在此搜索组件" v-model="searchText"></el-input>
    </div>
    <div class="component-list">
      <el-tabs class="el-dark-tabs" tab-position="top" v-model="typeTabValue">

        <el-tab-pane label="图表" name="chart">
          <div class="component-chart-list">
            <div class="component-item" v-for="(component, index) in chartList" :key="index">
              <p>{{ component.name }}</p>

              <vue-drag :option="component" :index="'chart' + index">
                  <dashboard-chart v-show="component.controlType == 'dashboard'"
                                   :style="getChartStyle(component)" draggable="true"
                                   :option="component"></dashboard-chart>

                  <curve-chart v-show="component.controlType == 'history'"
                               style="getChartStyle(chart)" draggable="true"
                               :option="component"></curve-chart>

                <status :style="getChartStyle(component)"
                        v-if="component.controlType == 'dashboard' && component.type == 'status'" :option="component"></status>


              </vue-drag>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="开关" name="control">
          <div class="component-chart-list">
            <div class="component-item" v-for="(component, index) in controlList" :key="index">
              <p>{{ component.name }}</p>

              <vue-drag :option="component" :index="'control' + index">
                <control :style="getChartStyle(component)" draggable="true"
                         :option="component"></control>
              </vue-drag>
            </div>
          </div>

        </el-tab-pane>

        <el-tab-pane label="视频" name="media"></el-tab-pane>

        <el-tab-pane label="报表" name="report"></el-tab-pane>

        <el-tab-pane label="组态" name="config">
          <configure-panel :search-text="searchText"></configure-panel>
        </el-tab-pane>

        <el-tab-pane label="其他" name="other">
          <other-panel></other-panel>
        </el-tab-pane>

      </el-tabs>



    </div>
  </div>
</template>

<script>
import DashboardChart from "@/components/e-charts/DashboardChart";
import CurveChart from "@/components/e-charts/CurveChart"
import Control from "@/components/control/Control";
import Status from "@/components/e-charts/Status";
import VueDrag from "@/components/drag"
// import Chart from "./chart";

import ConfigurePanel from "./configure"
import OtherPanel from "./other"
export default {
  name: "EditorAside",
  components: {
    DashboardChart, CurveChart, Control, Status, VueDrag, ConfigurePanel, OtherPanel
  },
  props: {
    componentList: {
      type: [Array],
      default: () => []
    }
  },
  data() {
    return {
      typeTabValue: "chart",
      searchText: "",
      chartList: [],
      controlList: [],
      mediaList: [],
      reportList: [],
      configurationList: [],
      otherList: []
    }
  },
  watch: {
    componentList: {
      handler(newValue) {
        if (newValue.length == 0) return;
        this.chartList = this.componentList.filter(item => {
          return (item.controlType == "dashboard" && item.type != "status") || item.controlType == "history"
        });
        console.log("====chartList", this.chartList)
        this.controlList = this.componentList.filter(item => {
          return item.controlType == "control";
        });
        console.log("====controlList", this.controlList)
      }
    }
  },
  mounted() {

  },
  methods: {
    getChartStyle(item) {
      return {
        borderRadius: "10px",
        width: "200px",
        height: "200px",
        backgroundColor: item.backgroundColor ? item.backgroundColor : "#2d3d86"
      }
    }
  }
}
</script>

<style scoped lang="scss">
.editor-container {
  //position: relative;
  width: 100%;
  height: calc(100% - 20px);
  padding: 10px;
  background-color: #202c62;

  .search-box {
    display: inline-flex;
    height: 50px;
    line-height: 50px;
    width: 100%;
    background-color: #202c62;
  }
  .component-list {
    width: 100%;
    height: calc(100% - 70px);
    margin-top: 20px;
    top: 50px;
    bottom: 0;
    background-color: #202c62;
    overflow-y: auto;
    .component-chart-list {
      width: 100%;
      height: 100%;
      .component-item {
        float:left;
        position: relative;
        width: 200px;
        height: 200px;
        margin: 2px;
        //border: 1px dashed #ccc;
        border-radius: 14px;
        background-color: #2d3d86;
        p {
          position: absolute;
          color: #fff;
          text-align: center;
          width: 100%;
        }
      }
    }
  }
}
</style>