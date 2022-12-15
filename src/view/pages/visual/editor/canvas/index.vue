<template>
  <div class="canvas-container" ref="canvas_container" >
    <div id="droppable" class="droppable" ref="droppable" :style="canvasStyle"
         tabindex="0" >
      <VueDraggableResizable
                    v-for="(component) in fullData" :key="component.cptId" :parent="false"
                    :x="component.point.x" :y="component.point.y"
                    :w="component.point.w" :h="component.point.h"
                    :z="component.point.z"
                    :scale="scale"
                    @activated="onActivated(component)" @deactivated="onDeactivated(component)"
                    @resizing="(left, top, width, height) => onResize(component, left, top, width, height)"
                    @resizestop="(left, top, width, height) => onResize(component, left, top, width, height)"
                    @dragstop="(left, top) => onDragstop(component, left, top)"
                    @keydown.native="e => onKeyDown(component, e)"
                    @click.native="onClick(component)"
                    @dblclick.native="onMouseDown(component)"
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

        <control :style="getChartStyle(component)"
                       :w="component.point.w" :h="component.point.h"
                       v-if="component.controlType == 'control'"
                       :option="component"></control>

        <configure :style="getConfigureStyle(component)"
                      :w="component.point.w" :h="component.point.h"
                   v-if="component.type == 'configure'" :option="component">
        </configure>

        <!-- 文本组件 -->
        <CommonText v-else-if="component.type == 'text'" :style="getConfigureStyle(component)"
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

const statusConfig = {
  IDLE: 0,
  DRAG_START: 1,
  DRAGGING: 2,
  MOVE_START: 3,
  MOVING: 4
}

const canvasInfo = {
  status: statusConfig.IDLE,
  target: null,
  lastEventPos: { x: null, y: null },
  offsetEventPos: { x: null, y: null },
  offset: { x: 0, y: 0 },
  scale: 1,
  scaleStep: .1,
  maxScale: 2,
  minScale: .5
}

export default {
  name: "EditorCanvas",
  components: {
    DashboardChart, HistoryChart, Control, Status, Configure, Other, CommonText, VideoPlayer, VueDraggableResizable
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
      // 画布上所有的组件集合
      fullData: [],
      tempData: [],
      currentId: "",
      defaultStyle: {backgroundColor: 'rgba(45, 61, 134, 1)'},
      canvasStyle: {},
      menuVisible: false, // 右键菜单
      zTopIndex: 500,   // 当前大屏的最高层
      zBottomIndex: 500,   // 当前大屏的最底层
      scale: 1,
      Specifications: {
        //定义的宽高比例，初始为1
        ww: 1,
        wh: 1,
        //根据class="home"里面定义的宽高进行作为初始宽高进行计算
        //！自定义内容！
        width: 1920,
        height: 919
        //！自定义内容！
      }
    }
  },
  watch: {
    jsonData: {
      handler(newValue) {
        console.log("====jsonData", newValue)
        if (!newValue || JSON.stringify(newValue) == "{}" ||newValue == undefined) return;
        let fullData = JSON.parse(JSON.stringify(newValue.screen)) ;
        if (fullData.length == 0) return;
        let canvasStyle = newValue.canvasStyle ? newValue.canvasStyle : {};
        // 显示大屏
        this.fullData = fullData;
        this.canvasStyle = canvasStyle;
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

      this.$refs.canvas_container.addEventListener("resize", this.handleCanvasResize, false);

    })

    // 监听数据改变
    bus.$on("changeData", data => {
      // console.log("====canvas.watch.changeData1", data)

      let index = this.fullData.findIndex(item => item.cptId == data.cptId)
      if (index < 0) return;
      let cpt = this.fullData[index];
      Object.keys(data).forEach(item => {
        cpt[item] = data[item];
      })
      // console.log("====canvas.watch.changeData2", cpt)
    })

    // 监听样式改变
    bus.$on('changeStyle', (cptId, style) => {
      // console.log("canvas.changeStyle", style)
      let index = this.fullData.findIndex(item => item.cptId == cptId)
      if (index < 0) return;
      let cpt = JSON.parse(JSON.stringify(this.fullData[index]));
      // console.log("cpt", cpt)
      cpt.style = style;
      this.fullData.splice(index, 1, cpt);
      // console.log(this.fullData)
    })
  },
  methods: {
    /**
     * 缩放
     * @param scale
     */
    setZoom(step) {
      if (this.scale >= 1.5 && step > 0) return;
      if (this.scale <= 0.5 && step < 0) return;
      this.scale += step;
      console.log("====setZoom", step)
      let droppable = document.getElementById("droppable")
      droppable.style.transform = "scale(" + this.scale + ")";
    },
    /**
     * 窗口自适应
     */
    adapt() {

    },
    handleCanvasResize() {
      console.log("====handleCanvasResize", window.innerWidth)
      console.log("====handleCanvasResize", window.innerHeight)
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
      let jsonOpt = e.dataTransfer.getData("option");
      if (!jsonOpt) return;
      this.zTopIndex++;
      let opt = JSON.parse(jsonOpt);
      console.log("====canvas.handleDrop", opt)
      opt.point = {h: 200, w: 200, x: e.offsetX, y: e.offsetY, z: this.zTopIndex};
      opt.cptId = getRandomString(9);
      opt.editable = false;
      opt.activeted = false;
      this.currentId = opt.cptId;
      delete opt.relativePoint;
      this.fullData.push(opt);
      // console.log(this.fullData)
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
      console.log("====onKeyDown", e)
      if (e.code == "Backspace") {
        // if (component.type == "text") return;
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
      component.editable = false;
      bus.$emit('share', JSON.parse(JSON.stringify(component)))
    },
    /**
     * 双击组件 组件可编辑
     * @param component
     */
    onMouseDown(component) {
      component.editable = true;
    },
    getChartStyle(item) {
      return {
        borderRadius: "10px",
        width: "100%",
        height: "100%",
        backgroundColor: item.backgroundColor ? item.backgroundColor : "#2d3d86"
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
      console.log("====handleDelete", this.fullData)
      console.log("====handleDelete.cptId", this.currentId)
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
      console.log(event)
      menu.style.left = event.clientX - 300 + 'px';
      menu.style.top = event.clientY - 50 + 'px'
      // 给整个document新增监听鼠标事件，点击任何位置执行 closeMenu 方法
      document.addEventListener('click', this.closeMenu)
    },
    dragCanvas(e) {
      console.log("====dragCanvas", e)
    }
  }
}
</script>

<style scoped>
.canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.droppable {
  /*position: absolute;*/
  position: relative;
  /*width: 100%;*/
  /*height: 100%;*/
  /*top: -100%;*/
  /*bottom: 40px;*/
  /*left: -100%;*/
  /*right: 10px;*/
  background-color: #171d46;
  /*background-color: #ea08a2;*/
  width: 1920px;
  height: 919px;
  transform-origin: 0 0;
  /*left: 50%;*/
  /*top: 50%;*/
  transition: 0.3s;

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
</style>