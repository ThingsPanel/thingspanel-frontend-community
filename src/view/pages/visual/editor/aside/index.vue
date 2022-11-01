<template>
  <div class="editor-container">
    <div class="search-box">
        <span style="width: 60px;color: #fff;">组件:</span>
        <el-input class="el-dark-input" suffix-icon="el-icon-search" placeholder="在此搜索组件"></el-input>
    </div>
    <div class="component-list">
      <el-tabs class="el-dark-tabs" tab-position="top" v-model="typeTabValue">
        <el-tab-pane label="图表" name="chart">
          <div class="component-chart-list">
            <div class="component-item" v-for="(chart, index) in chartList" :key="index">
              <p>{{ chart.name }}</p>

              <vue-drag :option="chart" :index="index">
                  <dashboard-chart v-show="chart.controlType == 'dashboard'" style="width: 200px;height: 200px"
                                   draggable="true"
                                   :option="chart"></dashboard-chart>

                  <curve-chart v-show="chart.controlType == 'history'" style="width:200px;height:200px;"
                               draggable="true"
                               :option="chart"></curve-chart>

              </vue-drag>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="开关" name="switch"></el-tab-pane>
        <el-tab-pane label="视频" name="media"></el-tab-pane>
        <el-tab-pane label="报表" name="report"></el-tab-pane>
        <el-tab-pane label="组态" name="config"></el-tab-pane>
        <el-tab-pane label="其他" name="other"></el-tab-pane>
      </el-tabs>



    </div>
  </div>
</template>

<script>
import DashboardChart from "@/components/e-charts/DashboardChart";
import CurveChart from "@/components/e-charts/CurveChart"
import VueDrag from "@/components/drag"
// import Chart from "./chart";
export default {
  name: "EditorAside",
  components: {
    DashboardChart, CurveChart, VueDrag
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
      chartList: [],
      switchList: [],
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
      }
    }
  },
  mounted() {

  }
}
</script>

<style scoped lang="scss">
.editor-container {
  width: 100%;
  height: 100%;
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
    margin-top: 20px;
    position: absolute;
    top: 50px;
    bottom: 0;
    background-color: #202c62;
    overflow-y: auto;


    .component-chart-list {
      display: flex;
      flex-flow: wrap;
      .component-item {
        display: block;
        position: relative;
        width: 200px;
        height: 200px;
        margin: 4px;
        //border: 1px dashed #ccc;
        border-radius: 14px;
        background-color: #2d3d86;
        //background-color: #fff;
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