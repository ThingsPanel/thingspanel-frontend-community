<template>
  <div class="canvas-container" ref="canvas_container" >
    <div id="droppable" class="droppable" ref="droppable" :style="canvasStyle"
         tabindex="0" @keydown="onKeyDown">
      <VueDragResize style=""
                     v-for="(component) in fullData" :key="component.cptId" :isDraggable="true" :isResizable="true"
                     :isActive="component.actived" :parentLimitation="true" :preventActiveBehavior="false"
                     :x="component.point.x" :y="component.point.y"
                     :w="component.point.w" :h="component.point.h"
                     @clicked="onClicked(component)"
                     @resizing="(rect) => onChangeStop(rect, component.cptId)"
                     @resizestop="(rect) => onChangeStop(rect, component.cptId)"
                     @dragstop="(rect) => onChangeStop(rect, component.cptId)"
      >
        <dashboard-chart :style="component.style ? component.style : defaultStyle"
                         :w="component.point.w" :h="component.point.h"
                         v-if="component.controlType == 'dashboard' && component.type != 'status'"
                         :option="component"></dashboard-chart>

        <history-chart :style="getChartStyle(component)"
                       :w="component.point.w" :h="component.point.h"
                       v-if="component.controlType == 'history'"
                       :option="component"></history-chart>

        <status :style="getChartStyle(component)"
                v-if="component.controlType == 'dashboard' && component.type == 'status'" :option="component"></status>

        <control :style="getChartStyle(component)"
                       :w="component.point.w" :h="component.point.h"
                       v-if="component.controlType == 'control'"
                       :option="component"></control>

      </VueDragResize>
    </div>
  </div>
</template>

<script>
import DashboardChart from "@/components/e-charts/DashboardChart";
import HistoryChart from "@/components/e-charts/CurveChart";
import Control from "@/components/control/Control";
import Status from "@/components/e-charts/Status";

import VueDragResize from 'vue-drag-resize'
import { getRandomString } from "@/utils/helpers";
import bus from "@/core/plugins/eventBus"

export default {
  name: "EditorCanvas",
  components: {
    DashboardChart, HistoryChart, Control, Status, VueDragResize
  },
  props: {
    screenData: {
      type: [Array],
      default: () => []
    }
  },
  data() {
    return {
      // 画布上所有的组件集合
      fullData: [],
      tempData: [],
      jsonData: {},
      currentId: "",
      defaultStyle: {backgroundColor: 'rgba(45, 61, 134, 1)'},
      canvasStyle: {}
    }
  },
  watch: {
    screenData: {
      handler(newValue) {
        if (newValue.length == 0) return;
        console.log("canvas.screenData", newValue)
        if (newValue[0].point) {
          this.fullData = JSON.parse(JSON.stringify(newValue));
          this.canvasStyle = { height: this.jsonData.style.height };
          this.tempData = JSON.parse(JSON.stringify(this.fullData));
        } else {
          this.fullData = JSON.parse(JSON.stringify(this.setLayout(newValue, 4, 10)))
          this.tempData = JSON.parse(JSON.stringify(this.fullData));
          this.jsonData.screen = this.tempData;
          this.jsonData.style = this.canvasStyle;
        }
        console.log("=================fullData===================")
        console.log(this.jsonData)
        console.log("=================fullData===================")

        // this.$nextTick(() => {
        //   let fullHeight = this.$refs.canvas_container.scrollHeight;
        //   this.$refs.canvas_container.clientHeight = fullHeight;
        //   console.log("fullHeight", fullHeight)
        // })

      },
      immediate: true
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.$refs.droppable.addEventListener("dragover", this.handleDragover);
      this.$refs.droppable.addEventListener("dragleave", this.handleDragLeave);
      this.$refs.droppable.addEventListener("drop", this.handleDrop);
      this.$refs.droppable.addEventListener("contextmenu", e => e.preventDefault());
      this.$refs.droppable.addEventListener("mousedown", e => {
        if (e.button == 2) {
          console.log("右键")
        }
      });
    })
    // 监听样式改变
    bus.$on('changeStyle', (cptId, style) => {
      console.log("canvas.changeStyle", style)
      let index = this.fullData.findIndex(item => item.cptId == cptId)
      if (index < 0) return;
      let cpt = JSON.parse(JSON.stringify(this.fullData[index]));
      console.log("cpt", cpt)
      cpt.style = style;
      this.fullData.splice(index, 1, cpt);
      // console.log(this.fullData)
    })
  },
  methods: {
    /**
     * 初始化图表的大小和位置
     * @param row   行数
     * @param span  间隔
     */
    setLayout(data, row, span) {
      let options = JSON.parse(JSON.stringify(data));
      // 获取画布的宽
      let fullWidth = this.$refs.droppable.offsetWidth;
      // 图表的边长
      let itemLength = (fullWidth - (row * span * 2)) / row;
      let rowI = 0;   // 列数
      let colI = 0;   // 行数
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
        options[i].cptId = getRandomString(9);
        rowI++;
      }
      let height = ((colI + 1) * itemLength) + ((colI + 1) * span) + "px";
      this.canvasStyle = { height, minHeight: 'calc(100% - 70px)' }
      return options;
    },
    /**
     * 当元素被拖放到放置区域后的回调
     * @param e
     */
    handleDragover(e) {
      // 阻止浏览器的默认行为
      e.preventDefault();
    },
    /**
     * 当拖拽元素离开放置区域后的回调
     * @param e
     */
    handleDragLeave(e) {
      console.log("====handleDragLeave")
    },
    /**
     * 当拖拽元素到放置区域后，松开鼠标的回调
     * e.offsetX  鼠标相对放置区域的X坐标
     * e.offsetY  鼠标相对放置区域的Y坐标
     * @param e
     */
    handleDrop(e) {
      e.preventDefault();
      console.log("handleDrop")
      let jsonOpt = e.dataTransfer.getData("option");
      let opt = JSON.parse(jsonOpt);
      opt.point = {
        h: 200,
        w: 200,
        x: e.layerX - opt.relativePoint.left,
        y: e.layerY - opt.relativePoint.top
      };
      opt.cptId = getRandomString(9);
      this.currentId = opt.cptId;
      delete opt.relativePoint;
      this.fullData.push(opt);
      this.$refs.droppable.focus();
    },
    /**
     * 组件被移动或改变大小时的回调
     * @param newRect
     */
    resize(newRect) {
    },
    /**
     * 结束拖拽/改变大小时的回调
     * @param newRect
     * @param cpt
     */
    onChangeStop(newRect, cptId) {
      console.log(this.fullData)
      console.log(newRect)
      let index = this.fullData.findIndex(item => item.cptId == cptId);
      let opt = JSON.parse(JSON.stringify(this.fullData[index]));
      opt.point = { x: newRect.left, y: newRect.top, h: newRect.height, w: newRect.width};
      this.currentId = opt.cptId;
      // this.fullData.splice(index, 1, opt);
      this.tempData.splice(index, 1, opt);
      this.jsonData.screen = this.tempData;
    },
    /**
     * 点击组件
     * @param component
     */
    onClicked(component) {
      let cpt = component;
      this.currentId = cpt.cptId;
      // 所有组件的激活状态设置为false
      this.fullData.forEach(item => {item.actived = false;})
      // 将当前选中的组件设为已激活状态
      let index = this.fullData.findIndex(item => item.cptId == cpt.cptId);
      cpt.actived = true;
      this.fullData.splice(index, 1, cpt);
      // 传递数据
      bus.$emit('share', JSON.parse(JSON.stringify(cpt)))
    },
    /**
     * 画布上的按键被按下后的回调
     * @param e
     */
    onKeyDown(e) {
      if (e.code == "Backspace") {
        let index = this.fullData.findIndex(item => item.cptId == this.currentId);
        console.log(index)
        this.fullData.splice(index, 1);
        console.log(this.fullData)
      }
    },
    getChartStyle(item) {
      return {
        borderRadius: "10px",
        width: "100%",
        height: "100%",
        backgroundColor: item.backgroundColor ? item.backgroundColor : "#2d3d86"
      }
    }
  }
}
</script>

<style scoped>
.canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}
.droppable {
  position: absolute;
  top: 40px;
  bottom: 40px;
  left: 10px;
  right: 10px;
  background-color: #171d46;
}
</style>