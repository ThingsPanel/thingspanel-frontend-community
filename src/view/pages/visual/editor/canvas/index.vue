<template>
  <div class="canvas-container" ref="canvas_container" >
    <div id="droppable" class="droppable" ref="droppable" :style="canvasStyle"
         tabindex="0" @keydown="onKeyDown">
      <VueDraggableResizable style=""
                     v-for="(component) in fullData" :key="component.cptId" :parent="true"
                     :x="component.point.x" :y="component.point.y"
                     :w="component.point.w" :h="component.point.h"
                     :z="component.point.z"
                     :scale="scale"
                    @activated="onActivated(component)"
                    @resizestop="(left, top, width, height) => onResizestop(component, left, top, width, height)"
                    @dragstop="(left, top) => onDragstop(component, left, top)"
      >
        <dashboard-chart :style="getChartStyle(component)" ref="component"
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
            :w="component.point.w" :h="component.point.h" :option="component"></CommonText>

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
    DashboardChart, HistoryChart, Control, Status, Configure, Other, CommonText, VueDraggableResizable
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
      scale: 1
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
        if (fullData[0].point) {
          // 显示大屏
          this.fullData = fullData;
          this.canvasStyle = canvasStyle;
        } else {
          // 无大屏显示插件图表
          this.fullData = JSON.parse(JSON.stringify(this.setLayout(fullData, 4, 10)));

        }

        console.log("=================fullData===================")
        console.log(this.fullData)
        console.log("=================fullData===================")

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
        e.preventDefault();
        if (e.button == 2) {
          console.log("右键")
          this.rightClick(e)
        }
      });
    })
    // 监听数据改变
    bus.$on("changeData", (cptId, data) => {
      // console.log("====canvas.watch.changeData1", data)

      let index = this.fullData.findIndex(item => item.cptId == cptId)
      if (index < 0) return;
      let cpt = JSON.parse(JSON.stringify(this.fullData[index]));
      Object.keys(data).forEach(item => {
        cpt[item] = data[item];
      })
      this.fullData.splice(index, 1, cpt);
      // console.log("====canvas.watch.changeData2", this.fullData)
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
      this.scale += step;
      console.log("====setZoom", step)
      let droppable = document.getElementById("droppable")
      droppable.style.transform = "scale(" + this.scale + ")";
    },
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
        options[i].point.z = this.zTopIndex;
        this.zTopIndex++;
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
      let jsonOpt = e.dataTransfer.getData("option");
      console.log("====canvas.handleDrop", jsonOpt)
      if (!jsonOpt) return;
      this.zTopIndex++;
      let opt = JSON.parse(jsonOpt);
      opt.point = {h: 200, w: 200, x: e.offsetX, y: e.offsetY, z: this.zTopIndex};
      opt.cptId = getRandomString(9);
      this.currentId = opt.cptId;
      delete opt.relativePoint;
      this.fullData.push(opt);
      // console.log(this.fullData)
      this.$refs.droppable.focus();
    },
    /**
     * 组件被改变大小时的回调
     * @param newRect
     */
    onResizestop(component, left, top, width, height) {
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
      this.currentId = cpt.cptId;
      bus.$emit('share', JSON.parse(JSON.stringify(cpt)))
    },
    /**
     * 画布上的按键被按下后的回调
     * @param e
     */
    onKeyDown(e) {
      if (e.code == "Backspace") {
        this.handleDelete();
      }
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
      console.log("handleSetZIndex", cpt)
    },
    handleDelete() {
      let index = this.fullData.findIndex(item => item.cptId == this.currentId);
      console.log(index)
      this.fullData.splice(index, 1);
      console.log(this.fullData)
    },
    rightClick(event) {
      this.menuVisible = false // 先把模态框关死，目的是 第二次或者第n次右键鼠标的时候 它默认的是true
      this.menuVisible = true // 显示模态窗口，跳出自定义菜单栏
      // event.preventDefault() //关闭浏览器右键默认事件
      let menu = document.querySelector('.menu')
      this.styleMenu(event, menu)
    },
    foo() {
      // 取消鼠标监听事件 菜单栏
      this.menuVisible = false
      document.removeEventListener('click', this.foo) // 关掉监听，
    },
    styleMenu(event, menu) {
      console.log(event)
      menu.style.left = event.clientX + 4 + 'px';
      menu.style.top = event.clientY + 'px'
      document.addEventListener('click', this.foo) // 给整个document新增监听鼠标事件，点击任何位置执行foo方法
      // if (event.clientX > 1800) {
      //   menu.style.left = event.offsetX + 30 + 'px'
      // } else {
      //   menu.style.left = event.offsetX + 1 + 'px'
      // }
      // if (event.clientY > 700) {
      //   menu.style.top = event.offsetY - 30 + 'px'
      // } else {
      //   menu.style.top = event.offsetY - 10 + 'px'
      // }
    },
    dragCanvas(e) {
      console.log("====dragCanvas", e)
    }
  }
}
</script>

<style scoped>
.canvas-container {
  /*position: relative;*/
  width: 100%;
  height: 100%;
  overflow-y: auto;
}
.droppable {
  /*position: absolute;*/
  position: relative;
  width: 100%;
  height: 100%;
  top: 40px;
  bottom: 40px;
  left: 10px;
  right: 10px;
  background-color: #171d46;
  .draggable-default {
    position: relative;
    border: 1px dashed #ccc;
  }
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