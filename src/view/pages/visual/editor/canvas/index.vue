<template>
  <div id="droppable" class="droppable" ref="droppable"  tabindex="0" @keydown="onKeyDown">
    <VueDragResize style="position: absolute"
        v-for="(component) in fullData" :key="component.cptId" :isDraggable="true" :isResizable="true"
                   :isActive="component.actived" :parentLimitation="true" :preventActiveBehavior="false"
                   :x="component.point.x" :y="component.point.y"
                   :w="component.point.w" :h="component.point.h"
                   @clicked="onClicked(component)"
                   @resizing="(rect) => onChangeStop(rect, component.cptId)"
                   @resizestop="(rect) => onChangeStop(rect, component.cptId)"
                   @dragstop="(rect) => onChangeStop(rect, component.cptId)"
    >
      <dashboard-chart style="position: absolute;width: 100%;height: 100%"
                       :w="component.point.w" :h="component.point.h"
                       v-if="component.controlType == 'dashboard'"
                       :option="component"></dashboard-chart>

      <history-chart style="position: absolute;width: 100%;height: 100%"
                     :w="component.point.w" :h="component.point.h"
                     v-if="component.controlType == 'history'"
                     :option="component"></history-chart>
    </VueDragResize>
  </div>
</template>

<script>
import DashboardChart from "@/components/e-charts/DashboardChart";
import HistoryChart from "@/components/e-charts/CurveChart";
import VueDragResize from 'vue-drag-resize'
import { getRandomString } from "@/utils/helpers";
import bus from "@/core/plugins/eventBus"

export default {
  name: "EditorCanvas",
  components: {
    DashboardChart, HistoryChart, VueDragResize
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
      currentId: "",
    }
  },
  watch: {
    screenData: {
      handler(newValue) {
        if (newValue.length == 0) return;
        this.fullData = JSON.parse(JSON.stringify(newValue));
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

  },
  methods: {
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
      console.log("onChangeStop")
      let index = this.fullData.findIndex(item => item.cptId == cptId);
      let opt = this.fullData[index];
      opt.point = { x: newRect.left, y: newRect.top, h: newRect.height, w: newRect.width};
      this.currentId = opt.cptId;
      this.fullData.splice(index, 1, opt);
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
      bus.$emit('share', cpt)
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
  }
}
</script>

<style scoped>
.droppable {
  position: absolute;
  top: 40px;
  bottom: 40px;
  left: 10px;
  right: 10px;
  background-color: #171d46;
}
</style>