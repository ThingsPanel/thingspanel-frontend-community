<template>
  <div class="common-container">
<!--    <el-tabs tab-position="left" style="height: 100%;width: 70px;float:left"-->
<!--             v-model="activeName">-->

<!--      <el-tab-pane v-for="({ label, value, icon }) in tabList" :key="value" :label="label" :name="value">-->
<!--        <div class="tab-label-left" slot="label">-->
<!--          <i :class="icon"></i>-->
<!--          <p>{{ label }}</p>-->
<!--        </div>-->
<!--      </el-tab-pane>-->

<!--    </el-tabs>-->
<!--    <div class="tab-content-right">-->
<!--      <div v-if="activeName=='dashboard'" class="component-chart-list">-->
<!--        <div class="component-item" v-for="(component, index) in chartList" :key="index">-->
<!--          <p>{{ component.name }}</p>-->

<!--          <vue-drag :option="component" :index="'chart' + index">-->
<!--            <dashboard-chart v-show="component.controlType == 'dashboard'"-->
<!--                             :style="getChartStyle(component)" draggable="true"-->
<!--                             :option="component"></dashboard-chart>-->

<!--            <curve-chart v-show="component.controlType == 'history'"-->
<!--                         style="getChartStyle(chart)" draggable="true"-->
<!--                         :option="component"></curve-chart>-->

<!--            <status :style="getChartStyle(component)"-->
<!--                    v-if="component.controlType == 'dashboard' && component.type == 'status'" :option="component"></status>-->


<!--          </vue-drag>-->
<!--        </div>-->
<!--      </div>-->

<!--      <div v-if="activeName=='curve'" class="component-chart-list">-->
<!--        <div class="component-item" v-for="(component, index) in curveList" :key="index">-->
<!--          <p>{{ component.name }}</p>-->
<!--          <vue-drag :option="component" :index="index">-->
<!--            <curve-chart style="getChartStyle(chart)" draggable="true" :option="component"></curve-chart>-->
<!--          </vue-drag>-->
<!--        </div>-->
<!--      </div>-->

<!--    </div>-->
  </div>
</template>

<script>
import DashboardPane from "./dashboard"
export default {
  name: "PluginTab",
  components: { DashboardPane },
  props: {
    searchText: {
      type: [String],
      default: ""
    },
    chartList: {
      type: [Array],
      default: () => []
    }
  },
  data() {
    return {
      activeName: "",
      tabList: [
        { label: "仪表盘", value: "dashboard", icon: "el-icon-pie-chart"},
        { label: "曲线", value: "curve", icon: "el-icon-chat-line-square"},
        { label: "开关", value: "switch", icon: "el-icon-setting"},
        { label: "状态", value: "status", icon: "el-icon-data-board"},
        { label: "视频", value: "video", icon: "el-icon-data-board"},
        { label: "报表", value: "report", icon: "el-icon-data-board"},
      ],
      // 曲线图列表
      curveList: []
    }
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
.tab-label-left {
  position:relative;
  display: flex;
  width: 50px;
  height:60px;
  text-align: center;
  i {
    position: absolute;
    top: 10px;
    width: 50px!important;
    height: 20px!important;
  }
  p {
    position: absolute;
    top: 20px;
    width: 50px!important;
    height: 20px!important;
  }
}
.tab-content-right {
  height: 100%;
  margin-left: 65px;
}
::v-deep .el-tabs__content {
  height: calc(100% - 50px);
  .el-tab-pane {
    height: 100%;
  }
}
::v-deep .el-tabs__header.is-left {
  width: 60px!important;
}
.el-tabs__item.is-left.is-active {
  .tab-label-left {
    background-color: #171d46;
    border-radius: 10px;
  }
}
</style>