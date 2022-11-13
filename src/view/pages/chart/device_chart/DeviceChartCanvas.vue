<template>
  <div class="container-canvas">
    <div v-if="!showScreen" class="canvas-default">
<!--      <div v-if="options && options.length > 0" class="container-charts">-->
        <PluginCharts :options="options" :device="device"></PluginCharts>

    </div>

    <div v-if="showScreen" class="canvas-screen">
      <div class="canvas-screen-drag">
        <VueDragResize style="position: absolute;"
                       v-for="(component) in componentList" :key="component.cptId"
                       :parentLimitation="true" :preventActiveBehavior="true"
                       :x="component.point.x" :y="component.point.y"
                       :w="component.point.w" :h="component.point.h"
        >
          <dashboard-chart :style="component.style ? component.style : defaultStyle"
                           :w="component.point.w" :h="component.point.h"
                           v-if="component.controlType == 'dashboard'" :value="component.value"
                           :option="component"></dashboard-chart>

          <status :style="component.style ? component.style : defaultStyle"
                  :w="component.point.w" :h="component.point.h"
                  v-if="component.controlType == 'dashboard' && component.type == 'status'" :value="component.value"
                  :option="component"></status>

          <history-chart :style="component.style ? component.style : defaultStyle"
                         :w="component.point.w" :h="component.point.h"
                         v-if="component.controlType == 'history'" :value="component.value"
                         :option="component"></history-chart>

          <control :style="component.style ? component.style : defaultStyle"
                   :w="component.point.w" :h="component.point.h"
                   v-if="component.controlType == 'control'" :value="component.value"
                   :option="component"></control>

          <configure :defaultStyle="component.style ? component.style : defaultStyle"
                     :w="component.point.w" :h="component.point.h"
                     v-if="component.type == 'configure'"
                     :option="component"></configure>

          <other :defaultStyle="component.style ? component.style : defaultStyle"
                 :w="component.point.w" :h="component.point.h"
                 v-if="component.type == 'text'" :value="component.value"
                 :option="component"></other>

        </VueDragResize>
      </div>

    </div>



  </div>
</template>

<script>
import {watch,  defineComponent, ref as reference} from "@vue/composition-api";
import {reactive, ref} from "@vue/composition-api/dist/vue-composition-api";
import ECharts from "./components/Echarts"
import Control from "./components/Control";

import ClipButton from "@/components/common/ClipButton";
import DashboardChart from "@/components/e-charts/DashboardChart";
import Status from "@/components/e-charts/Status"
import HistoryChart from "@/components/e-charts/CurveChart";
import Configure from "@/components/configure/Configure"
import Other from "@/components/other/Other"

import VueDragResize from 'vue-drag-resize'
import {GridLayout, GridItem} from "vue-grid-layout";
import PluginCharts from "./PluginCharts";
import bus from "@/core/plugins/eventBus"
import {currentValue, historyValue} from "@/api/device";

import { addTimer, clearTimer } from "@/utils/tool.js"

export default defineComponent ({
  name: "DeviceChartCanvas",
  components: {
    ECharts, Control, Status, ClipButton, DashboardChart, HistoryChart, VueDragResize,
    GridLayout, GridItem, PluginCharts, Configure, Other
  },
  props: {
    showScreen: {
      type: [Boolean],
      default: false
    },
    screenData: {
      type: [Array],
      default: () => []
    },
    canvasStyle: {
      type: [Object],
      default: () => { return {} }
    },
    device: {
      type: [Object],
      default: () => { return {} }
    }
  },
  setup(props, context) {
    let options = ref([]);
    let payloadTemplate = ref("{}");
    // 大屏数据
    let componentList = ref([]);

    // 监听share事件
    bus.$on('updateVisual', () => {
      console.log("===================updateVisual")
    })
    // 显示插件图表
    watch(() => props.screenData, value => {
      console.log("watch", value)

      options.value = value;
      console.log("options.value", value);

      if (props.showScreen && value.length > 0) {
        // 如果是大屏，则开始循环刷新数据
        console.log("==================showScreen.canvasStyle", props.canvasStyle)

        componentList.value = JSON.parse(JSON.stringify(value));
        refresh(componentList.value);
      } else {
        componentList.value = [];
      }

      if (options.value == undefined) {
        return;
      }

    }, {immediate: true, deep: true})

    watch(() => props.device, value => {
      console.log("====device", value)
    });

    let defaultStyle = {
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(45, 61, 134, 1)',
      borderRadius: '10px'
    };

    /**
     * 定时器
     */
    function refresh() {
      clearTimer();
      let timer = setInterval(listForEach(), 5000)
      addTimer(timer);
    }

    /**
     * 遍历组件
     * @returns {any}
     */
    function listForEach() {
      getCurrentValue();
      getHistoryValue();
      return listForEach;
    }

    function getCurrentValue() {
      let deviceId = props.device.id ? props.device.id : props.device.device;
      if (!deviceId) return;
      currentValue({ entity_id: deviceId })
        .then(({ data }) => {
          if (data.code == 200) {
            let datas = data.data;
            if (!datas || !datas[0]) return;
            componentList.value.forEach(item => {
              if (item.controlType == "dashboard" || item.controlType == "history" || item.type == "text") {
                getComponentValue(datas[0], item)
              }
            })
          }
        })
    }

    function getHistoryValue() {
      let deviceId = props.device.id ? props.device.id : props.device.device;
      if (!deviceId) return;
      for (let i = 0; i < componentList.value.length; i++) {
        let cpt = componentList.value[i];
        if (cpt.controlType == "history") {
          let attrs = cpt.mapping;
          let timestamp = (new Date()).getTime();
          let yesterday = timestamp-246060*1000;
          let rate = 10 * 1000 * 1000;  // 微秒
          let attribute = attrs.concat(["systime"])
          console.log("getHistoryValue")
          historyValue(
              {
                device_id: deviceId,
                attribute,
                "start_ts": yesterday,
                "end_ts": timestamp,
                rate
              }
          )
              .then(({ data }) => {
                if (data.code == 200) {
                  let arr = [];
                  cpt.mapping.forEach(map => {
                    arr.push({data: data.data[map], sysTime: data.data.systime});
                  })
                  cpt.value = JSON.stringify(arr)
                  componentList.value.splice(i, 1, cpt)
                }
              })
        }
      }

    }

    /**
     * 从服务器获取组件的值
     * @param component
     */
    function getComponentValue(data, component) {
      console.log("getComponentValue", data)
      let cpt = component;
      if (!cpt.mapping) return;
      let mapping = cpt.mapping;

      // 通过绑定的属性从后端获取值
      if (typeof mapping == "object") {
        // 图表组件
        if (component.controlType == "dashboard") {
          // 仪表盘
          component.value = [];
          mapping.forEach(map => {
            if (map && data[map]) {
              component.value.push(data[map]);
            }
          })
        } else if (component.controlType == "control") {

        }
        console.log(component, component.value)
      } else if (typeof mapping == "string") {
        console.log("====获取组件的值", component)
        console.log("====获取组件的值", data)
        // 文本组件
        if (mapping) {
          if (data[mapping]) {
            let unit = (component.unit != "-" && component.unit != undefined) ? component.unit : "";
            component.value = data[mapping] + " " + unit;
          }
        }
      }
    }

    return {
      options,
      payloadTemplate,
      componentList,
      defaultStyle
    }
  }
})
// const clearTimer = () => {
//   var timers = JSON.parse(localStorage.getItem("timers"));
//   if (timers && timers.length > 0)
//   timers.forEach(timer => clearInterval(timer))
//   localStorage.setItem("timers", null);
// }
</script>

<style scoped lang="scss">
.container-canvas {
  position: relative;
  width: 100%;
  height: 100%!important;
  overflow-y: auto!important;
  border: 3px solid #161e43;
  border-radius: 10px;
  background-color: #1f2a5f;
  .canvas-screen {
    position: relative;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    .canvas-screen-drag {
      position: absolute;
      top: 40px;
      bottom: 40px;
      left: 10px;
      right: 10px;
    }
  }
}
.canvas-default {
  width: 100%;
  height: 100%;
}
.container-charts {
  width: 100%;
  height: 100%;
  display: block;
  //display: flex;
  //position: relative;
  //flex-flow: wrap;
  ////position: absolute;
  //height: 100%!important;
  ////overflow-y: auto!important;
  //padding: 10px;
  //background-color: #1f2a5f;
}
</style>