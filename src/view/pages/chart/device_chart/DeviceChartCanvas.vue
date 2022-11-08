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
                     v-for="(component) in screenData" :key="component.cptId"
                     :parentLimitation="true" :preventActiveBehavior="true"
                     :x="component.point.x" :y="component.point.y"
                     :w="component.point.w" :h="component.point.h"
      >
        <dashboard-chart :style="component.style ? component.style : defaultStyle"
                         :w="component.point.w" :h="component.point.h"
                         v-if="component.controlType == 'dashboard'"
                         :option="component"></dashboard-chart>

        <history-chart :style="component.style ? component.style : defaultStyle"
                       :w="component.point.w" :h="component.point.h"
                       v-if="component.controlType == 'history'"
                       :option="component"></history-chart>
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
import VueDragResize from 'vue-drag-resize'
import {GridLayout, GridItem} from "vue-grid-layout";
import PluginCharts from "./PluginCharts";
import bus from "@/core/plugins/eventBus"

export default defineComponent ({
  name: "DeviceChartCanvas",
  components: {
    ECharts, Control, Status, ClipButton, DashboardChart, HistoryChart, VueDragResize,
    GridLayout, GridItem, PluginCharts
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
      console.log("options.value", value)

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

    return {
      options,
      payloadTemplate,
      componentList,
      defaultStyle
    }
  }
})
const clearTimer = () => {
  var timers = JSON.parse(localStorage.getItem("timers"));
  if (timers && timers.length > 0)
  timers.forEach(timer => clearInterval(timer))
  localStorage.setItem("timers", null);
}
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