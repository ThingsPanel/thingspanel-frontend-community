<!-- 点击设备默认显示插件图表 -->
<template>
  <div style="width: 100%;height: 100%;overflow-y: auto">
    <grid-layout  style="width: 100%;height: 100%"
        :layout.sync="optionsData" :col-num="colNum" :row-height="30"
        :is-draggable="true" :is-resizable="true" :is-mirrored="false"
        :vertical-compact="true" :margin="[10, 10]" :use-css-transforms="true"
         @layout-updated="handleLayoutUpdatedEvent"
    >

      <grid-item class="grid-item" v-for="(option, index) in optionsData" :key="option['id'] + index"
                 dragAllowFrom=".chart-header"
                 :x="option.x"
                 :y="option.y"
                 :w="option.w"
                 :h="option.h"
                 :i="option.i"
                 @moved="handleResized(option.i)"
                 @resized="(l, r, w, h) => handleResized(option.i, {l, r, w, h})">

        <e-charts class="component-item" :ref="'component_' + option.i" :key="option['id']" :show-header="true"
                  v-if="option.controlType == 'dashboard' && !option.type"
                  :option="option" :device="device" :value="option.value"></e-charts>

        <curve class="component-item" :ref="'component_' + option.i" :key="option['id']" :show-header="true"
               v-if="option.controlType == 'history'"
               :option="option" :device="device" :value="option.value"></curve>

        <status class="component-item" :ref="'component_' + option.i" :key="option['id']" :show-header="true"
                v-if="option.controlType == 'dashboard' && option.type == 'status'" :option="option" :device="device"></status>

        <device-status class="component-item" :ref="'component_' + option.i" :key="option['id']" :show-header="true"
                v-if="option.controlType == 'dashboard' && option.type == 'deviceStatus'"
                       :option="option" :device="device" :value="option.value"></device-status>

        <control class="component-item" :ref="'component_' + option.i" :key="option['id']" :show-header="true"
                 v-if="option.controlType == 'control'" :option="option" :device="device"></control>

        <video-component class="component-item" style="min-width: 200px;min-height: 200px" :ref="'component_' + option.i"
                         :key="option['id']" :show-header="true"
                 v-if="option.controlType == 'video'" :option="option" :device="device"></video-component>

      </grid-item>
    </grid-layout>

<!--    <div v-show="status == pluginStatus.LOADING" class="plugin-loading">-->
<!--      正在加载插件图表...-->
<!--    </div>-->

<!--    <div v-show="status == pluginStatus.NONE" class="plugin-loading">-->
<!--      该设备未绑定插件，请绑定插件...-->
<!--    </div>-->

  </div>

</template>


<script>
import { GridLayout, GridItem } from "vue-grid-layout";
import ECharts from "./components/Echarts"
import Curve from "./components/Curve";
import Control from "./components/Control";
import Status from "./components/Status"
import DeviceStatus from "./components/DeviceStatus"
import VideoComponent from "./components/Video";
import {device_info} from "@/api/device";
import {device_update, historyValue} from "@/api/device";
import {currentValue} from "@/api/device";

export default {
  name: "PluginCharts",
  components: { GridLayout, GridItem, ECharts, Curve,  Control, Status, DeviceStatus, VideoComponent },
  props: {
    options: {
      type: [Array],
      default: () => []
    },
    tsl: {
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
      optionsData: [],
      // grid-layout的列数
      colNum: 24,
      pluginStatus: {
        LOADING: 0,
        LOADED: 1,
        NONE: 2
      },
      // 插件状态
      status: 0,
      // 5秒刷新一次组件的值
      flushTime: 5,
      // 计时器
      timer: null
    }
  },
  watch: {
    options: {
      handler(newValue) {
        let timer = localStorage.getItem("deviceWatch_timer");
        if (timer) {
          clearInterval(parseInt(timer));
        }
        if (newValue && newValue.length > 0) {
          let options = JSON.parse(JSON.stringify(newValue));
          this.getLayout(options, 4)
        } else {
          this.optionsData = [];
          this.status = this.pluginStatus.NONE;
        }
      }
    }
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
  methods: {
    handleResized(i, rect) {
      console.log("====handleResized.i", i)
      this.$nextTick(() => {
          this.$refs["component_" + i][0].sizeChange();
      })
    },
    /**
     * 读取设备的图表的布局
     * @param options
     */
    getLayout(options) {
      device_info({id: this.device.device })
        .then(({data}) => {
          if (data.code == 200) {
            console.log("====getLayout", data.data)
            if (data.data['chart_option'] && data.data['chart_option'] != "[]" && data.data['chart_option'] != "{}") {
              let layout = JSON.parse(data.data['chart_option']);
              for (let i = 0; i < this.options.length; i++) {
                let option = layout.find(item => item.id == this.options[i].id)
                if (!option) {
                  option = {x: 0, y: 0, w: 6, h: 6, i}
                }
                options[i].x = option.x;
                options[i].y = option.y;
                options[i].w = option.w;
                options[i].h = option.h;
                options[i].i = option.i;
                // this.handleResized(i);
              }
              this.optionsData = options;
            } else {
              // 如果读取到的布局为空，则显示默认布局
              this.optionsData = this.getDefaultLayout(options, 4)
            }
            // this.handleResized(i);
            this.status = this.pluginStatus.LOADED;
            this.getComponentMaps(this.optionsData);
          }
        })
    },
    /**
     * 获取默认布局
     * @param options
     * @param col
     * @returns {*}
     */
    getDefaultLayout(options, col) {
      // 每个元素的宽占几列
      let colW = this.colNum / col;
      // 每个元素的高占几行
      let rowH = colW;
      // 列数，行数
      let colI = 0, rowI = 0;
      for (let i = 0; i < options.length; i++) {
        if (colI == col) {
          // 如果超过4列则换行
          rowI++;
          colI = 0;
        }
        options[i].w = colW;
        options[i].h = rowH;
        options[i].x = colI * colW;
        options[i].y = rowI * rowH;
        options[i].i = i;
        colI++;
        // this.handleResized(i);
      }
      return options;
    },
    /**
     * 保存当前布局
     */
    setLayout() {
      if (!this.device.device || !this.optionsData) {
        return;
      }
      let layout = this.optionsData.map(item => {
        return { x: item.x, y: item.y, w: item.w, h: item.h, i: item.i, id: item.id }
      })
      device_update({id: this.device.device, chart_option: JSON.stringify(layout) })
        .then(res => {})
    },
    /**
     * 布局改变的回调
     * @param newLayout
     */
    handleLayoutUpdatedEvent(newLayout) {
      this.setLayout();
    },
    /**
     * 1.遍历组件
     * 2.根据组件类型获取当前值/历史曲线值
     * 3.给组件赋值
     */
    getComponentMaps(options) {
      let componentMaps = {current: [], history: []};
      for (let i = 0; i < options.length; i++) {
        let option = options[i];
        if (option.controlType == "dashboard") {
          componentMaps.current.push({id: option.id, map: this.getMapping(option)});
        } else if (option.controlType == "control" && option.type != "setValue") {
          componentMaps.current.push({id: option.id, map: this.getControlMapping(option)});
        } else if (option.controlType == "history") {
          componentMaps.history.push({id: option.id, i: option.i, map: this.getMapping(option)});
        }
      }
      this.updateComponents(componentMaps);
    },
    /**
     * 更新组件的值
     * @param componentMaps
     */
    updateComponents(componentMaps) {
      const fun = () => {
        if (componentMaps.current.length > 0) {
          this.getCurrent(componentMaps.current);
        }
        if (componentMaps.history.length > 0) {
          this.getHistory(componentMaps.history);
        }
        return fun;
      }
      this.timer = setInterval(fun(), this.flushTime * 1000)
      localStorage.setItem("deviceWatch_timer", this.timer + "");
    },
    /**
     * 从服务器获取指定设备的推送数据
     * @param deviceId
     * @param attrs
     */
    getCurrent(componentMap) {
      currentValue({entity_id: this.device.device})
          .then(({data}) => {
            if (data.code == 200) {
              this.optionsData.forEach(option => {
                  let index = componentMap.findIndex(item => item.id == option.id);
                  if (componentMap[index]) {
                    let mapping = componentMap[index].map;
                    let values = null;
                    if (option.controlType == "dashboard") {
                      if (option.type == "deviceStatus") {
                        values = data.data[0].systime;
                      } else {
                        values = mapping.map(item => {
                          return {...item, value: data.data[0][item.name]}
                        });
                      }
                    } else if (option.controlType == "control") {
                      values = {};
                      mapping.forEach(item => {
                        values[item] = data.data[0][item];
                      });
                    }

                    this.$nextTick(() => {
                      this.$refs["component_" + option.i][0].updateOption(values);
                    })
                  }
                // }
              })
            }
          })
    },
    getHistory(componentMap) {
      this.$nextTick(() => {
        componentMap.forEach(item => {
          let ref = this.$refs["component_" + item.i];
          if (ref && ref[0]) {
            ref[0].getHistory(item.map);
          }
        })
      })
    },
    getMapping(option) {
      if (option.mapping) {
        let mapping = [];
        this.tsl.map(property => {
          option.mapping.forEach(item => {
            if (property.name == item) {
              mapping.push(property);
            }
          })
        })
        return mapping;
      } else {
        return [];
      }
    },
    getControlMapping(option) {
      if (option.series && option.series.length > 0) {
        // 开关的mapping
        let mapping = [];
        option.series.forEach(item => {
          mapping.push(item.mapping.value);
        })
        return mapping;
      }
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
  //position: absolute;
  top: 0;
  left: 0;
}
.plugin-loading {
  color: #fff;
  font-size: 18px;
}
::v-deep .vue-resizable-handle {
  background: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNjcxMDc3NzUzOTcyIiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjI5MjciIHdpZHRoPSI2IiBoZWlnaHQ9IjYiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48cGF0aCBkPSJNNzcyLjA5NiAyNDMuNzEycTE3LjQwOC0xNy40MDggMzkuNDI0LTIyLjUyOHQ0MC45NiAyLjA0OCAzMS43NDQgMjYuNjI0IDEyLjggNTAuMTc2bDAgNDYxLjgyNHEwIDI3LjY0OC05LjIxNiA1Mi4yMjR0LTI1LjYgNDMuMDA4LTM4LjkxMiAyOC42NzItNDkuMTUyIDEwLjI0bC00OTAuNDk2IDBxLTI2LjYyNCAwLTQzLjUyLTEzLjMxMnQtMjMuMDQtMzIuNzY4LTEuMDI0LTQxLjQ3MiAyMi41MjgtMzkuNDI0cTI1LjYtMjUuNiA3MC4xNDQtNjkuMTJ0OTguMzA0LTk2LjI1NiAxMTAuNTkyLTEwOS4wNTYgMTA3LjUyLTEwNS45ODQgOTAuMTEyLTg4LjU3NiA1Ni44MzItNTYuMzJ6IiBwLWlkPSIyOTI4IiBmaWxsPSIjZmZmZmZmIj48L3BhdGg+PC9zdmc+);
  background-position: 100% 100%;
  background-repeat: no-repeat;
  background-origin: content-box;
  -webkit-box-sizing: border-box;
}
</style>