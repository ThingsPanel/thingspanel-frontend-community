<template>
  <div class="common-container">
    <el-cascader ref="cascaderRef" class="el-cascader" :options="casOptions" :props="{ emitPath: false }"
                 filterable @change="handleChangeOptions">
      <template slot-scope="{ node, data }">
        <span>{{ data.label }}</span>
        <span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>
        <span v-if="data.device_id">({{ data.plugin_id ? "已绑定" : "未绑定" }})</span>
      </template>
    </el-cascader>

    <el-collapse class="el-dark-collapse aside-plugin-collapse" style="padding:10px;" v-model="activeNames">
      <el-collapse-item v-for="(components, index) in componentList" :key="components.value" :title="components.label"
                        :name="components.value">
        <div class="component-item" v-for="(component, index) in components.children" :key="component.id">-->
          <p class="component-item-title">{{ component.name }}</p>

          <vue-drag :option="component" :index="component.id">

            <!-- 仪表盘 -->
            <dashboard-chart v-show="component.controlType == 'dashboard'"
                             :style="getChartStyle(component)"
                             :option="component"></dashboard-chart>

            <!-- 曲线图 -->
            <curve-chart v-show="component.controlType == 'history'"
                         style="getChartStyle(chart)"
                         :option="component"></curve-chart>

            <!-- 开关 -->
            <control v-show="component.controlType == 'control'"
                     style="getChartStyle(chart)"
                     :option="component"></control>

            <!-- 状态 -->
            <status :style="getChartStyle(component)"
                    v-if="component.controlType == 'dashboard' && component.type == 'status'"
                    :option="component"></status>


          </vue-drag>
        </div>
      </el-collapse-item>

    </el-collapse>
  </div>
</template>

<script>
import VueDrag from "@/components/drag"
import DashboardChart from "@/components/e-charts/DashboardChart";
import CurveChart from "@/components/e-charts/CurveChart";
import Control from "@/components/control/Control";
import Status from "@/components/e-charts/Status";
import PluginAPI from "@/api/plugin"
import bus from "@/core/plugins/eventBus"

export default {
  name: "PluginTab",
  components: {VueDrag, DashboardChart, CurveChart, Control, Status},
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
      activeNames: [""],
      componentList: [
        {label: "仪表盘", value: "dashboard", children: []},
        {label: "曲线", value: "history", children: []},
        {label: "开关", value: "control", children: []},
        {label: "状态", value: "status", children: []},
        {label: "视频", value: "video", children: []},
        {label: "报表", value: "report", children: []},
      ],
      casOptions: []
    }
  },
  mounted() {
    // 获取项目/分组/设备的级联菜单
    bus.$on('getCasOptions', val => {
      this.casOptions = val;
    });
  },
  methods: {
    /**
     * 级联菜单选中节点时的回调
     */
    handleChangeOptions(v) {
      let node = this.$refs.cascaderRef.getCheckedNodes()[0];
      if (!node) return;
      this.componentList.forEach(item => item.children = []);
      if (node.data.business_id) {
        // 项目
      } else if (node.data.group_id) {
        // 分组
      } else if (node.data.device_id) {
        // 设备
        let pluginId = node.data.plugin_id;
        if (pluginId) {
          PluginAPI.page({id: pluginId, current_page: 1, per_page: 10})
              .then(({data}) => {
                if (data.code == 200 || data.code == "200") {
                  let jsonData = data.data.data.length > 0 ? data.data.data[0] : "{}"
                  let jsonObj = JSON.parse(jsonData.chart_data);
                  let {chart} = jsonObj;
                  chart.forEach(item => {
                    let it = JSON.parse(JSON.stringify(item));
                    if (it.controlType == "dashboard") {
                      let cpt = this.componentList.find(component => component.value == "dashboard")
                      it.deviceId = node.data.device_id;
                      cpt.children.push(it);
                    } else if (it.controlType == "history") {
                      let cpt = this.componentList.find(component => component.value == "history")
                      it.deviceId = node.data.device_id;
                      cpt.children.push(it);
                    } else if (it.controlType == "control") {
                      let cpt = this.componentList.find(component => component.value == "control")
                      it.deviceId = node.data.device_id;
                      cpt.children.push(it);
                    }
                  })
                  this.activeNames = ["dashboard", "history", "control", "status", "video", "report"];
                  //
                }
              })
        }
      }
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
.common-container {
  height: 100%;

  .aside-plugin-collapse {
    height: 100%;
    overflow-y: auto;

    .component-item {
      position: relative;
      width: 180px;
      height: 100%;
      //border: 1px dashed #ccc;
      border-radius: 14px;
      //background-color: #2d3d86;
      .component-item-title {
        position: absolute;
        color: #fff;
        text-align: center;
        width: 100%;
      }
    }
  }
}

.tab-label-left {
  position: relative;
  display: flex;
  width: 50px;
  height: 60px;
  text-align: center;

  i {
    position: absolute;
    top: 10px;
    width: 50px !important;
    height: 20px !important;
  }

  p {
    position: absolute;
    top: 20px;
    width: 50px !important;
    height: 20px !important;
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
  width: 60px !important;
}

.el-tabs__item.is-left.is-active {
  .tab-label-left {
    background-color: #171d46;
    border-radius: 10px;
  }
}

.el-cascader {
  width: 100%;
}

.component-item-title {
  color: #fff;

}

</style>