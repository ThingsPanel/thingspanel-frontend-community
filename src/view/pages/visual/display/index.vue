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
        <dashboard-chart :style="getChartStyle(component)" ref="component" :key="'dashboard_' + component.cptId"
                         :w="component.point.w" :h="component.point.h"
                         v-if="component.controlType == 'dashboard' && component.type != 'status'"
                         :value="component.value"
                         :option="component"></dashboard-chart>

        <history-chart :style="getChartStyle(component)"
                       :w="component.point.w" :h="component.point.h"
                       v-if="component.controlType == 'history'"
                       :option="component"></history-chart>

        <pie-chart :style="getChartStyle(component)" :loading="false"
                   :w="component.point.w" :h="component.point.h"
                   v-if="component.type == 'pie'"
                   :option="component"></pie-chart>

        <bar-chart :style="getChartStyle(component)" :loading="false"
                   :w="component.point.w" :h="component.point.h"
                   v-if="component.type == 'bar'"
                   :option="component"></bar-chart>

        <status :style="getChartStyle(component)"
                v-if="component.controlType == 'dashboard' && component.type == 'status'" :option="component"></status>

        <control :style="getChartStyle(component)"
                 :w="component.point.w" :h="component.point.h"
                 v-if="component.controlType == 'control'"
                 :option="component"></control>

        <configure :style="getConfigureStyle(component)"
                   :w="component.point.w" :h="component.point.h"
                   v-if="component.type == 'configure'" :option="component">
        </configure>

        <!-- 文本组件 -->
        <CommonText v-else-if="component.type == 'text'" :style="getStyle(component)"
                    :active="component.activeted" :editable="component.editable"
                    :value="component.value"
                    :w="component.point.w" :h="component.point.h" :option="component"></CommonText>

        <video-player :style="getChartStyle(component)"
                 :w="component.point.w" :h="component.point.h"
                 v-if="component.type == 'video'" :option="component"
                  :src="component.src" :autoplay="true"></video-player>

        <other :style="getConfigureStyle(component)"
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
      flushTime: 5,
      // 计时器
      timer: null
    }
  },
  mounted() {
    let id = this.$route.query.id;
    VisualAPI.list({ current_page: 1, per_page: 10, id })
      .then(({ data }) => {
        if (data.code == 200) {
          let result = data.data.data ? data.data.data[0] : {};
          let jsonData = result ? result.json_data : "{}";
          console.log("====display", result);
          let jsonObj = JSON.parse(jsonData);
          document.title = result.dashboard_name ? result.dashboard_name : "";
          this.fullData = jsonObj.screen.length > 0 ? JSON.parse(JSON.stringify(jsonObj.screen)) : [];
          if (jsonObj.canvasStyle && JSON.stringify(jsonObj.canvasStyle) != "{}") {
            for (let key in jsonObj.canvasStyle) {
              this.canvasStyle[key] = jsonObj.canvasStyle[key];
            }
          }
          this.setCanvasStyle("canvasDisplay", "canvasContainer");
          this.refresh(this.fullData);
        }
      })
  },
  methods: {
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
    refresh(fullData) {
      const fun = () => {
        fullData.forEach(item => {
          if (item.controlType == "dashboard") {
            //
            this.getCurrent(item);
          } else if (item.type == "text") {
            console.log("====item", item);
            this.getCurrent(item);
          }
        })
        return fun;
      }

      this.timer = setInterval(fun(), this.flushTime * 1000);

    },
    getCurrent(cpt) {
      console.log("====display.getCurrent.cpt", cpt)
      let entity_id = cpt.deviceId;
      let attribute = cpt.mapping;
      let values = [];
      if (!entity_id || !attribute) return;
      currentValue({ entity_id, attribute })
        .then(({ data }) => {
          if (data.code == 200 && data.data != null) {
            let result = data.data[0];
            if (typeof attribute == "string") {
              values = [result[attribute]];
            } else if (typeof attribute == "object") {
              values = attribute.map(attr => result[attr]);
            }
            cpt.value = values;
            console.log("====display.getCurrent", cpt.controlType, values)
          }
        })
    }
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