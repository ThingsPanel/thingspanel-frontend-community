<template>
  <div class="container-canvas">
    <div v-if="!showScreen" class="canvas-default">
<!--      <div v-if="options && options.length > 0" class="container-charts">-->
        <PluginCharts :options="options" :device="device"></PluginCharts>
<!--        <grid-layout-->
<!--            :layout.sync="options"-->
<!--            :col-num="15"-->
<!--            :row-height="30"-->
<!--            :is-draggable="true"-->
<!--            :is-resizable="true"-->
<!--            :is-mirrored="false"-->
<!--            :vertical-compact="true"-->
<!--            :margin="[10, 10]"-->
<!--            :use-css-transforms="true"-->
<!--        >-->
<!--          <grid-item class="grid-item" v-for="option in options" :key="option['i']"-->
<!--                     :x="option['x']"-->
<!--                     :y="option['y']"-->
<!--                     :w="option['w']"-->
<!--                     :h="option['h']"-->
<!--                     :i="option['i']"-->
<!--          >-->
<!--&lt;!&ndash;            <div v-for="option in options" :key="option['id']">&ndash;&gt;-->

<!--              <e-charts style="width: 100%;height: 100%"-->
<!--                        v-if="(option.controlType == 'dashboard' || option.controlType == 'history') && option.type != 'status'"-->
<!--                        :option="option" :device="device"></e-charts>-->

<!--              <status style="width: 100%;height: 100%"-->
<!--                      v-if="option.controlType == 'dashboard' && option.type == 'status'" :option="option" :device="device"></status>-->

<!--              <control style="width: 100%;height: 100%" v-if="option.controlType == 'control'" :option="option" :device="device"></control>-->

<!--&lt;!&ndash;            </div>&ndash;&gt;-->
<!--          </grid-item>-->
<!--        </grid-layout>-->

<!--      </div>-->
    </div>

    <div v-if="showScreen" class="canvas-screen">
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

        <history-chart :style="component.style ? component.style : defaultStyle"
                       :w="component.point.w" :h="component.point.h"
                       v-if="component.controlType == 'history'"
                       :option="component"></history-chart>

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
</template>

<script>
import {watch,  defineComponent, ref as reference} from "@vue/composition-api";
import {reactive, ref} from "@vue/composition-api/dist/vue-composition-api";
import ECharts from "./components/Echarts"
import Control from "./components/Control";
import Status from "./components/Status"

import ClipButton from "@/components/common/ClipButton";
import DashboardChart from "@/components/e-charts/DashboardChart";
import HistoryChart from "@/components/e-charts/CurveChart";
import Configure from "@/components/configure/Configure"
import Other from "@/components/other/Other"

import VueDragResize from 'vue-drag-resize'
import {GridLayout, GridItem} from "vue-grid-layout";
import PluginCharts from "./PluginCharts";
import bus from "@/core/plugins/eventBus"
import {currentValue} from "@/api/device";

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

      console.log("==================showScreen", props.showScreen)
      if (props.showScreen && value.length > 0) {
        // 如果是大屏，则开始循环刷新数据
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
      getCurrentValue()
      return listForEach;
    }

    function getCurrentValue() {
      let deviceId = props.device.id ? props.device.id : props.device.device;
      if (!deviceId) return;
      currentValue({ entity_id: deviceId })
        .then(({ data }) => {
          if (data.code == 200) {
            let datas = data.data;
            componentList.value.forEach(item => {
              if (item.controlType == "dashboard" || item.controlType == "history" || item.type == "text") {
                getComponentValue(datas[0], item)
              }
            })
          }
        })

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
        }
        console.log(component, component.value)
      } else if (typeof mapping == "string") {
        // 文本组件
        if (mapping) {
          if (data[mapping]) {
            component.value = data[mapping];
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
  width: 100%;
  height: 100%!important;
  overflow-y: auto!important;
  border: 3px solid #161e43;
  border-radius: 10px;
  background-color: #1f2a5f;
  .canvas-screen {
    //display: flex;
    position: absolute;
    //flex-flow: wrap;
    //overflow-y: auto!important;
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