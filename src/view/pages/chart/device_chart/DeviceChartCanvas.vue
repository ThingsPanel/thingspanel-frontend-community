<template>
  <div class="container-canvas">
    <div v-if="!showScreen" class="canvas-screen">
      <div v-if="options && options.length > 0" class="container-charts">
        <div v-for="option in options" :key="option['id']">

          <e-charts style="width: 360px;height: 360px"
                    v-if="(option.controlType == 'dashboard' || option.controlType == 'history') && option.type != 'status'"
                    :option="option" :device="device"></e-charts>

          <status style="width: 360px;height: 360px"
                  v-if="option.controlType == 'dashboard' && option.type == 'status'" :option="option" :device="device"></status>

          <control style="width: 360px;height: 360px" v-if="option.controlType == 'control'" :option="option" :device="device"></control>

        </div>
      </div>
    </div>

    <div v-if="showScreen" class="canvas-screen">
      <VueDragResize style="position: absolute;"
                     v-for="(component) in screenData" :key="component.cptId"
                     :parentLimitation="true" :preventActiveBehavior="true"
                     :x="component.point.x" :y="component.point.y"
                     :w="component.point.w" :h="component.point.h"
      >
        <dashboard-chart style="width: 100%;height: 100%;"
                         :w="component.point.w" :h="component.point.h"
                         v-if="component.controlType == 'dashboard'"
                         :option="component"></dashboard-chart>

        <history-chart style="width: 100%;height: 100%"
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
import ECharts from "./Echarts"
import Control from "./Control";
import Status from "./Status"
import ClipButton from "@/components/common/ClipButton";
import DashboardChart from "@/components/e-charts/DashboardChart";
import HistoryChart from "@/components/e-charts/CurveChart";
import VueDragResize from 'vue-drag-resize'
export default defineComponent ({
  name: "DeviceChartCanvas",
  components: {
    ECharts, Control, Status, ClipButton, DashboardChart, HistoryChart, VueDragResize
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

    // 显示插件图表
    watch(() => props.screenData, value => {
      console.log("watch", value)

      options.value = value;
      if (options.value == undefined) {
        return;
      }

      // 获得推送数据示例
    //   let arr = [];
    //   console.log("====DeviceChartCanvas 1")
    //   options.value.forEach(option => {
    //     option['mapping'].forEach(map => {
    //       arr.push(map);
    //     })
    //   })
    //   console.log("====DeviceChartCanvas 2")
    //
    //   let temp = {};
    //   for (let i = 0; i < arr.length; i++) {
    //     temp[arr[i]] = "值" + (i+1);
    //   }
    //   payloadTemplate.value = JSON.stringify(temp);
    //   console.log("====payloadTemplate", payloadTemplate);
    //   // 清空计时器
    //   clearTimer();
    }, {immediate: true, deep: true})

    watch(() => props.device, value => {
      console.log("====device", value)
    });

    return {
      options,
      payloadTemplate,
      componentList
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
.container-charts {
  display: flex;
  position: relative;
  flex-flow: wrap;
  //position: absolute;
  height: 100%!important;
  //overflow-y: auto!important;
  padding: 10px;
  background-color: #1f2a5f;
}
</style>