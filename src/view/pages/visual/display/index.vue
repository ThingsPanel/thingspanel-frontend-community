<template>
  <div class="canvas-container" ref="canvasContainer">
    <div class="canvas-display" id="canvas_display" ref="canvasDisplay">
      <VueDraggableResizable style="" class-name="draggable-class"
                             v-for="(component) in fullData" :key="component.cptId" :parent="false"
                             :disable-user-select="false" :draggable="false" :resizable="false"
                             :x="component.point.x" :y="component.point.y"
                             :w="component.point.w" :h="component.point.h"
                             :z="component.point.z"
                             :scale="defaultScale"
      >
        <dashboard-chart :style="getChartStyle(component)" :ref="'component_' + component.cptId" :key="'dashboard_' + component.cptId"
                         :w="component.point.w" :h="component.point.h"
                         v-if="component.controlType == 'dashboard' && component.type != 'status'"
                         :value="component.value"
                         :option="component"></dashboard-chart>

        <history-chart :style="getChartStyle(component)" :ref="'component_' + component.cptId"
                       :w="component.point.w" :h="component.point.h"
                       v-if="component.controlType == 'history'"
                       :option="component"></history-chart>

        <pie-chart :style="getChartStyle(component)" :loading="false" :ref="'component_' + component.cptId"
                   :w="component.point.w" :h="component.point.h"
                   v-if="component.type == 'pie'" :value="component.value"
                   :option="component"></pie-chart>

        <bar-chart :style="getChartStyle(component)" :loading="false" :ref="'component_' + component.cptId"
                   :w="component.point.w" :h="component.point.h"
                   v-if="component.type == 'bar'" :value="component.value"
                   :option="component"></bar-chart>

        <status :style="getChartStyle(component)" :ref="'component_' + component.cptId"
                v-if="component.controlType == 'dashboard' && component.type == 'status'" :option="component"></status>

        <control :style="getChartStyle(component)" :ref="'component_' + component.cptId"
                 :w="component.point.w" :h="component.point.h"
                 v-if="component.controlType == 'control'"
                 :option="component"></control>

        <configure :style="getConfigureStyle(component)" :ref="'component_' + component.cptId"
                   :w="component.point.w" :h="component.point.h"
                   v-if="component.type == 'configure'" :option="component">
        </configure>

        <!-- 文本组件 -->
        <CommonText v-else-if="component.type == 'text'" :style="getStyle(component)" :ref="'component_' + component.cptId"
                    :active="component.activeted" :editable="component.editable"
                    :value="component.value"
                    :w="component.point.w" :h="component.point.h" :option="component"></CommonText>

        <video-player :style="getChartStyle(component)" :ref="'component_' + component.cptId"
                 :w="component.point.w" :h="component.point.h"
                 v-if="component.type == 'video'" :option="component"
                  :src="component.src" :autoplay="true"></video-player>

        <other :style="getConfigureStyle(component)" :ref="'component_' + component.cptId"
               :w="component.point.w" :h="component.point.h"
               v-else-if="component.type == 'other'" :option="component"></other>


      </VueDraggableResizable>
    </div>
  </div>
</template>

<script>
import DashboardChart from "@/components/e-charts/DashboardChart";
import HistoryChart from "@/components/e-charts/CurveChart";
import PieChart from "@/components/e-charts/PieChart"
import BarChart from "@/components/e-charts/BarChart"
import Control from "@/components/control/Control";
import Status from "@/components/e-charts/Status";
import Configure from "@/components/configure/Configure"
import Other from "@/components/other/Other"
import CommonText from "@/components/text/CommonText"
import VideoPlayer from "@/components/common/VideoPlayer";

import VueDraggableResizable from 'vue-draggable-resizable'
import 'vue-draggable-resizable/dist/VueDraggableResizable.css'

import VisualAPI from "@/api/visualization.js"
import { currentValue } from "@/api/device"
import "@/core/mixins/visual"

export default {
  name: "VisualDisplay",
  components: {
    DashboardChart, HistoryChart, PieChart, BarChart, Control, Status, Configure, Other, CommonText, VueDraggableResizable,
    VideoPlayer
  },
  data() {
    return {
      // 刷新间隔
      flushTime: 10,
      // 计时器
      timer: null
    }
  },
  mounted() {
    let { id, mode } = this.$route.query;
    if (mode === "preview") {
      // 预览模式
      let jsonData = localStorage.getItem("visual_json_data");
      this.initCanvas(jsonData);
    } else {
      VisualAPI.list({ current_page: 1, per_page: 10, id })
          .then(({ data }) => {
            if (data.code == 200) {
              let result = data.data.data ? data.data.data[0] : {};
              document.title = result.dashboard_name ? result.dashboard_name : "";
              let jsonData = result ? result.json_data : "{}";
              this.initCanvas(jsonData)
            }
          })
    }
  },
  methods: {
    initCanvas(jsonData) {
      let jsonObj = JSON.parse(jsonData);
      this.fullData = jsonObj.screen.length > 0 ? JSON.parse(JSON.stringify(jsonObj.screen)) : [];
      if (jsonObj.canvasStyle && JSON.stringify(jsonObj.canvasStyle) != "{}") {
        for (let key in jsonObj.canvasStyle) {
          this.canvasStyle[key] = jsonObj.canvasStyle[key];
        }
      }
      this.setCanvasStyle("canvasDisplay", "canvasContainer");
      this.refresh(this.fullData);
    },
    /**
     * 放大
     */
    handleZoomOut() {
      this.scale += 0.1;
      this.setZoom(this.scale);
    },
    /**
     * 缩小
     */
    handleZoomIn() {
      this.scale -= 0.1;
      this.setZoom(this.scale);
    },
    getChartStyle(item) {
      return {
        borderRadius: "10px",
        width: "100%",
        height: "100%",
        backgroundColor: item.backgroundColor ? item.backgroundColor : "#2d3d86"
      }
    },
    getConfigureStyle(item) {
      return {
        borderRadius: "10px",
        width: "100%",
        height: "100%",
        backgroundColor: item.backgroundColor ? item.backgroundColor : "transparent"
      }
    },
    /**
     * 刷新组件的值
     */
    async refresh(fullData) {
      const getList = (list, cpt) => {
        if (cpt.dataSrc) {
          cpt.dataSrc.forEach(dataSrcItem => {
            let index = list.findIndex(item => item == dataSrcItem.deviceId)
            if (index == -1) {
              list.push(dataSrcItem.deviceId );
            }
          })
        }
      };

      let currentList = [];
      let historyList = [];
      fullData.forEach(cpt => {
        if (cpt.type == "curve") {
          getList(historyList, cpt);
        } else {
          getList(currentList, cpt);
        }
      });

      const fun = async () => {
        let values = [];
        for (let i = 0; i < currentList.length; i++) {
          let entity_id = currentList[i];
          await currentValue({ entity_id })
              .then(({ data }) => {
                if (data.code == 200) {
                  let value = data.data ? data.data[0] : null;
                  values.push({ deviceId: entity_id, value})
                  if (i == currentList.length - 1) {
                    // 请求调用完毕，更新组件的值
                    this.updateComponentValue(values);
                  }
                }
              });
        }

        for (let i = 0; i < historyList.length; i++) {

        }
        return fun;
      }

      this.timer = setInterval(await fun(), this.flushTime * 1000);
    },
    /**
     * 更新组件的值
     * @param values   [{ deviceId, value }, ... ]
     */
    updateComponentValue(values) {
      console.log("====display.updateComponentValue.请求调用完毕", this, values);
      this.fullData.forEach(cpt => {
        /*
          dataSrc: [
            {
                "casValue": ["", "", ""],
                "deviceId": "",
                "property": {"dataType": "integer","unit": "-","title": "DO1","name": "DO1", ...}
            },
            ...
          ]
         */
        if (cpt.dataSrc) {
          let valueList = [];
          cpt.dataSrc.forEach(item => {
            values.forEach(val => {
              if (item.deviceId == val.deviceId) {
                console.log("====updateComponentValue", val)
                valueList.push(JSON.parse(JSON.stringify(val)));
              }
            })
          })
          // 
          const ref = this.$refs['component_' + cpt.cptId];
          if (ref) {
            ref[0].setEChartsValue(valueList)
          } else {
            cpt.value = JSON.parse(JSON.stringify(valueList));
          }
        }
      })
    },
    /*
      饼图 绑定n个设备， 每个设备都要发一次请求，n个请求全都返回成功后再刷新饼图的数据
      曲线图 绑定n个设备， 每个设备都要发一次请求，n个请求全都返回成功后再刷新曲线图的数据
      柱状图 绑定n个设备， 每个设备都要发一次请求，n个请求全都返回成功后再刷新柱状图的数据
      报表 ?
     */

  }
}
</script>

<style scoped lang="scss">
.canvas-container {
  position: relative;
  width: 100%!important;
  height: 100%!important;
  padding: 0;
  margin: 0;
  background-color: var(--color);
  .canvas-display {
    width: var(--w);
    height: var(--h);
    background-color: var(--color);
    transform-origin: 0 0;
  }
  .draggable-class {
    position: absolute;
    border: unset;
  }
}
</style>