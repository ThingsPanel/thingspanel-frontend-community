<template>
  <div class="editor-container">
    <div class="search-box">
        <span style="width: 60px;color: #fff;">组件:</span>
        <el-input class="el-dark-input" suffix-icon="el-icon-search" placeholder="在此搜索组件" v-model="searchText"></el-input>
    </div>
    <div class="component-list">
      <el-tabs class="el-dark-tabs" style="height: 100%" tab-position="top" v-model="typeTabValue">


        <!-- ==========================常规组件 start======================================== -->
        <el-tab-pane label="常规组件" name="common" >
          <common-tab></common-tab>
        </el-tab-pane>
        <!-- ==========================常规组件 end========================================== -->


        <!-- ==========================插件组件 start======================================== -->
        <el-tab-pane label="插件组件" name="plugin">
          <plugin-tab></plugin-tab>
        </el-tab-pane>
        <!-- ==========================插件组件 end======================================== -->


        <!-- ==========================我的组件 start======================================== -->
        <el-tab-pane label="我的组件" name="myself"></el-tab-pane>
        <!-- ==========================我的组件 end======================================== -->


<!--        <el-tab-pane label="图表" name="chart">-->
<!--          <div class="component-chart-list">-->
<!--            <div class="component-item" v-for="(component, index) in chartList" :key="index">-->
<!--              <p>{{ component.name }}</p>-->

<!--              <vue-drag :option="component" :index="'chart' + index">-->
<!--                  <dashboard-chart v-show="component.controlType == 'dashboard'"-->
<!--                                   :style="getChartStyle(component)" draggable="true"-->
<!--                                   :option="component"></dashboard-chart>-->

<!--                  <curve-chart v-show="component.controlType == 'history'"-->
<!--                               style="getChartStyle(chart)" draggable="true"-->
<!--                               :option="component"></curve-chart>-->

<!--                <status :style="getChartStyle(component)"-->
<!--                        v-if="component.controlType == 'dashboard' && component.type == 'status'" :option="component"></status>-->


<!--              </vue-drag>-->
<!--            </div>-->
<!--          </div>-->
<!--        </el-tab-pane>-->

<!--        <el-tab-pane label="开关" name="control">-->
<!--          <div class="component-chart-list">-->
<!--            <div class="component-item" v-for="(component, index) in controlList" :key="index">-->
<!--              <p>{{ component.name }}</p>-->

<!--              <vue-drag :option="component" :index="'control' + index">-->
<!--                <control :style="getChartStyle(component)" draggable="true"-->
<!--                         :option="component"></control>-->
<!--              </vue-drag>-->
<!--            </div>-->
<!--          </div>-->

<!--        </el-tab-pane>-->



      </el-tabs>



    </div>
  </div>
</template>

<script>
import CommonTab from "./common"
import PluginTab from "./plugin"

export default {
  name: "EditorAside",
  components: { CommonTab, PluginTab },
  props: {
    componentList: {
      type: [Array],
      default: () => []
    }
  },
  data() {
    return {
      typeTabValue: "common",
      searchText: "",
      commonActiveNames: [""],
      pluginActiveName: "",
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
    handleCommonTabsClick(tab) {
      console.log("====tab", tab)
    },
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
::v-deep .el-tabs--left {
  padding-left: 0px!important;
  margin-left: 0px!important;
  text-align: center!important;
}
::v-deep .el-tabs__item.is-left {
  height: 60px!important;
  padding-left: 0px!important;
  margin-left: 0px!important;
  text-align: center!important;

}
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
    //overflow-y: auto;
    .component-chart-list {
      width: 100%;
      height: 100%;
      .component-item {
        float:left;
        position: relative;
        //width: 200px;
        //height: 200px;
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