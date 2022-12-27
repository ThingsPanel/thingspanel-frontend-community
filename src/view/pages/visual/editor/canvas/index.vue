<template>
  <div class="canvas-container" ref="canvas_container" >
    <div id="droppable" class="droppable" ref="droppable" :style="canvasStyle" @click="handleClickBackground"
         tabindex="0" >
      <VueDraggableResizable :id="'drag_box_' + component.cptId"
                    v-for="(component) in fullData" :key="component.cptId" :parent="true"
                    :x="component.point.x" :y="component.point.y"
                    :w="component.point.w" :h="component.point.h"
                    :z="component.point.z"
                    :scale="defaultScale" :disableUserSelect="false"
                    @activated="onActivated(component)" @deactivated="onDeactivated(component)"
                    @resizing="(left, top, width, height) => onResize(component, left, top, width, height)"
                    @resizestop="(left, top, width, height) => onResize(component, left, top, width, height)"
                    @dragstop="(left, top) => onDragstop(component, left, top)"
                    @keydown.native="e => onKeyDown(component, e)"
                    @click.native="onClick(component)"
                    @dblclick.native="onDBClick(component)"
      >
        <dashboard-chart :style="getChartStyle(component)" ref="component" :key="'dashboard_' + component.cptId"
                         :w="component.point.w" :h="component.point.h"
                         v-if="component.controlType == 'dashboard' && component.type != 'status'"
                         :option="component"></dashboard-chart>

        <history-chart :style="getChartStyle(component)"
                       :w="component.point.w" :h="component.point.h"
                       v-if="component.controlType == 'history'"
                       :option="component"></history-chart>

        <status :style="getChartStyle(component)"
                v-if="component.controlType == 'dashboard' && component.type == 'status'" :option="component"></status>

        <pie-chart :style="getChartStyle(component)" :loading="false"
                       :w="component.point.w" :h="component.point.h"
                       v-if="component.type == 'pie'"
                       :option="component"></pie-chart>

        <bar-chart :style="getChartStyle(component)" :loading="false"
                       :w="component.point.w" :h="component.point.h"
                       v-if="component.type == 'bar'"
                       :option="component"></bar-chart>

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
                    :value.sync="component.value"
            :w="component.point.w" :h="component.point.h" :option="component"></CommonText>

        <video-player
                   :w="component.point.w" :h="component.point.h"
                   v-if="component.type == 'video'" :option="component">
        </video-player>

        <other :style="getConfigureStyle(component)"
               :w="component.point.w" :h="component.point.h"
               v-else-if="component.type == 'other'" :option="component"></other>


      </VueDraggableResizable>
    </div>

    <!-- 右键菜单 start -->
    <div id="contextmenu"
         v-show="menuVisible"
         class="menu">
      <div class="contextmenu__item" @click="handleSetZIndex('top')">置于顶层</div>
      <div class="contextmenu__item" @click="handleSetZIndex('bottom')">置于底层</div>
      <div class="contextmenu__item" @click="handleSetZIndex('increase')">向上一层</div>
      <div class="contextmenu__item" @click="handleSetZIndex('decrease')">向下一层</div>
      <div class="contextmenu__item" @click="handleDelete">删除</div>
    </div>
    <!-- 右键菜单 end -->

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
import VideoPlayer from "@/components/common/VideoPlayer"

import VueDraggableResizable from 'vue-draggable-resizable'
import 'vue-draggable-resizable/dist/VueDraggableResizable.css'

import { getRandomString } from "@/utils/helpers";
import bus from "@/core/plugins/eventBus"
import "@/core/mixins/visual"


export default {
  name: "EditorCanvas",
  components: {
    DashboardChart, HistoryChart, PieChart, BarChart, Control, Status, Configure, Other, CommonText, VideoPlayer, VueDraggableResizable
  },
  props: {
    jsonData: {
      type: [Object],
      default: () => {
        return {
          screen: [],
          canvasStyle: {}
        }
      }
    }
  },
  data() {
    return {
      currentId: "",
      defaultStyle: {backgroundColor: 'rgba(45, 61, 134, 1)'},
      menuVisible: false, // 右键菜单
      zTopIndex: 500,   // 当前大屏的最高层
      zBottomIndex: 500,   // 当前大屏的最底层
      isInComponent: false,

    }
  },
  watch: {
    jsonData: {
      handler(newValue) {
        if (!newValue || JSON.stringify(newValue) == "{}" ||newValue == undefined) return;

        // 显示大屏
        this.fullData = newValue.screen.length > 0 ? JSON.parse(JSON.stringify(newValue.screen)) : [];

        if (newValue.canvasStyle && JSON.stringify(newValue.canvasStyle) != "{}") {
          for (let key in newValue.canvasStyle) {
            this.canvasStyle[key] = newValue.canvasStyle[key];
          }
        }
        this.setCanvasStyle("droppable", "canvas_container", 40);
        // 默认显示页面设置面板
        bus.$emit("share", {type: "background", ...this.canvasStyle})
      },
      immediate: true
    }
  },
  mounted() {

    // 事件监听
    this.$nextTick(() => {
      this.$refs.droppable.addEventListener("dragover", this.handleDragover);
      this.$refs.droppable.addEventListener("dragleave", this.handleDragLeave);
      this.$refs.droppable.addEventListener("drop", this.handleDrop);
      this.$refs.droppable.addEventListener("contextmenu", e => e.preventDefault());
      this.$refs.droppable.addEventListener("mousedown", e => {
        e.preventDefault();
        if (e.button == 2) {
          console.log("右键")
          this.rightClick(e)
        }
      });

      window.addEventListener("resize", () => {
        this.setCanvasStyle("droppable", "canvas_container", 40);

      }, null);
      // 默认显示页面设置面板
      bus.$emit("share", {type: "background", ...this.canvasStyle})

    })

    // 监听数据改变
    bus.$on("changeData", data => {
      let index = this.fullData.findIndex(item => item.cptId == data.cptId)
      if (index < 0) return;
      let cpt = this.fullData[index];
      Object.keys(data).forEach(item => {
        cpt[item] = data[item];
      })
    })

    // 监听样式改变
    bus.$on('changeStyle', (cptId, style) => {
      if (cptId == null && style.type=="background") {
        // 画布背景设置
        if (style.intWidth) this.canvasStyle.intWidth = style.intWidth
        if (style.intHeight) this.canvasStyle.intHeight = style.intHeight
        if (style.backgroundColor) this.canvasStyle.backgroundColor = style.backgroundColor;
        this.setCanvasStyle("droppable", "canvas_container", 40);
      } else {
        // 组件设置
        let index = this.fullData.findIndex(item => item.cptId == cptId)
        if (index < 0) return;
        let cpt = JSON.parse(JSON.stringify(this.fullData[index]));
        cpt.style = style;
        this.fullData.splice(index, 1, cpt);
      }
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
      let jsonOpt = e.dataTransfer.getData("option");
      if (!jsonOpt) return;
      this.zTopIndex++;
      let opt = JSON.parse(jsonOpt);
      opt.point = {h: 200, w: 200, x: e.offsetX, y: e.offsetY, z: this.zTopIndex};
      opt.cptId = getRandomString(9);
      opt.editable = false;
      opt.activeted = false;
      delete opt.relativePoint;
      this.fullData.push(opt);
      this.handleUnselect(this.currentId);
      this.handleSelect(opt.cptId);
      this.currentId = opt.cptId;
      this.$refs.droppable.focus();
    },
    /**
     * 组件被改变大小时的回调
     * @param component
     * @param left
     * @param top
     * @param width
     * @param height
     */
    onResize(component, left, top, width, height) {
      component.point.x = left;
      component.point.y = top;
      component.point.w = width;
      component.point.h = height;
    },
    /**
     * 组件被移动时的回调
     * @param component
     * @param left
     * @param top
     */
    onDragstop(component, left, top) {
      component.point.x = left;
      component.point.y = top;
    },
    /**
     * 激活组件
     * @param component
     */
    onActivated(component) {
      let cpt = component;
      component.activeted = true;
      this.handleUnselect(this.currentId);
      this.handleSelect(component.cptId);
      this.currentId = cpt.cptId;
      bus.$emit('share', JSON.parse(JSON.stringify(cpt)))
    },
    onDeactivated(component) {
      component.activeted = false;
      component.editable = false;
    },
    /**
     * 画布上的按键被按下后的回调
     * @param e
     */
    onKeyDown(component, e) {
      if (e.code == "Backspace") {
        this.handleDelete(component);
      } else if (e.code == "Enter") {
        component.editable = false;
        bus.$emit('share', JSON.parse(JSON.stringify(component)))
      }
    },
    /**
     * 单击组件 组件不可编辑
     * @param component
     */
    onClick(component) {
      this.isInComponent = true;
      component.editable = false;
      bus.$emit('share', JSON.parse(JSON.stringify(component)))
    },
    /**
     * 单击画布
     */
    handleClickBackground(e) {
      if (!this.isInComponent) {
        this.handleUnselect(this.currentId);
        bus.$emit("share", {type: "background", ...this.canvasStyle})
      }
      setTimeout(() => {
        this.isInComponent = false
      }, 100);
    },
    /**
     * 双击组件 组件可编辑
     * @param component
     */
    onDBClick(component) {
      component.editable = true;
    },
    getChartStyle(style) {
      return {
        borderRadius: "10px",
        width: "100%",
        height: "100%",
        backgroundColor: style.backgroundColor ? style.backgroundColor : "transparent"
      }
    },
    /**
     * 设置组件层级
     * @param item
     * @returns {{backgroundColor: (*|string), borderRadius: string, width: string, height: string}}
     */
    getConfigureStyle(item) {
      return {
        borderRadius: "10px",
        width: "100%",
        height: "100%",
        backgroundColor: item.backgroundColor ? item.backgroundColor : "transparent"
      }
    },
    handleSetZIndex(status) {
      let index = this.fullData.findIndex(item => item.cptId == this.currentId);
      let cpt = this.fullData[index];
      if (status == "top") {
        // 置顶
        cpt.point.z = this.zTopIndex + 1;
        this.zTopIndex++;
      } else if (status == "bottom") {
        // 置底
        cpt.point.z = this.zBottomIndex - 1;
        this.zBottomIndex--;
      } else if (status == "increase") {
        // 置为上一层
        cpt.point.z++;
        if (cpt.point.z > this.zTopIndex) this.zTopIndex = cpt.point.z;
      } else if (status == "decrease") {
        // 置为下一层
        cpt.point.z--;
        if (cpt.point.z < this.zBottomIndex) this.zBottomIndex = cpt.point.z;
      }
      this.fullData.splice(index, 1, cpt);
    },
    handleDelete(component = null) {
      let cptId = this.currentId;

      let index = this.fullData.findIndex(item => item.cptId == cptId);
      this.fullData.splice(index, 1);
    },
    rightClick(event) {
      if (!this.currentId) return;
      this.menuVisible = false // 先把模态框关死，目的是 第二次或者第n次右键鼠标的时候 它默认的是true
      this.menuVisible = true // 显示模态窗口，跳出自定义菜单栏
      // event.preventDefault() //关闭浏览器右键默认事件
      let menu = document.querySelector('.menu')
      this.styleMenu(event, menu)
    },
    closeMenu() {
      // 取消鼠标监听事件 菜单栏
      this.menuVisible = false
      // 关掉监听，
      document.removeEventListener('click', this.closeMenu)
    },
    styleMenu(event, menu) {
      menu.style.left = event.clientX - 300 + 'px';
      menu.style.top = event.clientY - 50 + 'px'
      // 给整个document新增监听鼠标事件，点击任何位置执行 closeMenu 方法
      document.addEventListener('click', this.closeMenu)
    },
    dragCanvas(e) {
    }
  }
}
</script>

<style scoped lang="scss">
.canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.droppable {
  position: relative;
  background-color: var(--color);
  width: var(--w);
  height: var(--h);
  transform-origin: 0 0;
  transition: 0.3s;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1)
}
.contextmenu__item {
  display: block;
  line-height: 34px;
  text-align: center;
}
.contextmenu__item:not(:last-child) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}
.menu {
  position: absolute;
  background-color: #fff;
  width: 100px;
  /*height: 106px;*/
  font-size: 12px;
  color: #444040;
  border-radius: 4px;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.175);
  white-space: nowrap;
  z-index: 1000;
}
.contextmenu__item:hover {
  cursor: pointer;
  background: #66b1ff;
  border-color: #66b1ff;
  color: #fff;
}
.draggable.resizable.vdr {
  border: 1px dashed #293b79;
}
.active.draggable.resizable.vdr {
  border: 2px solid #26c705;
  background-color: #2d3d86;
}
::v-deep .handle-tl {
  z-index: 9999!important;
}
::v-deep .handle-tm {
  z-index: 9999!important;
}
.active.draggable.resizable.selected {
  border: 2px solid #26c705;
  background-color: #354793;
}
</style>