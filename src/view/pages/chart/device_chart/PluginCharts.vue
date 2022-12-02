<!-- 点击设备默认显示插件图表 -->
<template>
  <div style="width: 100%;height: 100%;position:relative" >
    <div class="chart-container" ref="chart_container">
      <VueDragResize v-for="(option, index) in optionsData" :key="index"
                     :isDraggable="false" :isResizable="false" :isActive="false"
                     :parentLimitation="true" :preventActiveBehavior="false"
                     :x="option.point.x" :y="option.point.y"
                     :w="option.point.w" :h="option.point.h"
      >
        <e-charts class="component-item" :ref="'component_' + index"
                  v-if="(option.controlType == 'dashboard' || option.controlType == 'history') && option.type != 'status'"
                  :option="option" :device="device"></e-charts>

        <status class="component-item" :ref="'component_' + index"
                v-if="option.controlType == 'dashboard' && option.type == 'status'" :option="option" :device="device"></status>

        <control class="component-item" :ref="'component_' + index"
                 v-if="option.controlType == 'control'" :option="option" :device="device"></control>
      </VueDragResize>

    </div>

  </div>

</template>


<script>
import {GridLayout, GridItem} from "vue-grid-layout";
import ECharts from "./components/Echarts"
import Control from "./components/Control";
import Status from "./components/Status"
import {device_info} from "@/api/device";
import {device_update} from "../../../../api/device";
import VueDragResize from 'vue-drag-resize'

export default {
  name: "PluginCharts",
  components: {GridLayout, GridItem, ECharts, Control, Status, VueDragResize},
  props: {
    options: {
      type: [Array],
      default: () => []
    },
    device: {
      type: [Object],
      default: () => { return {} }
    }
  },
  data() {
    return {
      optionsData: []
    }
  },
  watch: {
    options: {
      handler(newValue) {
        console.log("pluginChart.options", newValue)
        let options = JSON.parse(JSON.stringify(newValue))
        for (let i = 0; i < this.options.length; i++) {
          // options[i].x = options[i].y = 0;
          // options[i].w = 4;
          // options[i].h = 6;
          options[i].i = i;
        }
        this.optionsData = options;
        this.setLayout(4, 10);
        this.handleResized();
      }
    }
  },
  mounted() {

  },
  methods: {
    handleResized(i, w, h) {
      this.$refs["component_" + i][0].sizeChange();
      this.setLayout();
    },
    /**
     * 初始化图表的大小和位置
     * @param row   行数
     * @param span  间隔
     */
    setLayout(row, span) {
      // 获取画布的宽
      let fullWidth = this.$refs.chart_container.offsetWidth;
      // 图表的边长
      let itemLength = (fullWidth - (row * span * 2)) / row;
      let rowI = 0;   // 列数
      let colI = 0;   // 行数
      let options = this.optionsData;
      for (let i = 0; i < options.length; i++) {
        if (rowI == row) {
          // 如果超过4列则换行
          rowI = 0;
          colI = colI + 1;
        }
        options[i].point = {};
        options[i].point.x = (rowI * itemLength) + (span * rowI);
        options[i].point.y = (colI * itemLength) + (span * colI);
        options[i].point.h = itemLength;
        options[i].point.w = itemLength;
        rowI++;
      }
      this.optionsData = options;
    },
    handleLayoutUpdatedEvent(newLayout) {
      this.$nextTick(() => {
        newLayout.forEach(item => {
          console.log()
          this.$refs["component_" + item.i][0].sizeChange();
        })
      })

    }
  }
}
</script>

<style scoped lang="scss">
.grid-item {
  width: 360px;
  height: 360px;
  /*background-color: #cc0000;*/
}
.chart-container {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  .chart-item {
    float: left;
    padding-top: 30%;
    width: 30%;
    margin: 10px;
    position: relative;
  }
}
.component-item {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
</style>