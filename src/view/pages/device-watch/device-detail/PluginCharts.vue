<!-- 点击设备默认显示插件图表 -->
<template>
  <div style="width: 100%;height: 100%;overflow-y: auto">
    <grid-layout v-if="status == pluginStatus.LOADED" style="width: 100%;height: 100%"
        :layout.sync="optionsData" :col-num="colNum" :row-height="30"
        :is-draggable="true" :is-resizable="true" :is-mirrored="false"
        :vertical-compact="true" :margin="[10, 10]" :use-css-transforms="true"
         @layout-updated="handleLayoutUpdatedEvent"
    >

      <grid-item class="grid-item" v-for="option in optionsData" :key="option['id']"
                 :x="option.x"
                 :y="option.y"
                 :w="option.w"
                 :h="option.h"
                 :i="option.i"
                 @moved="handleResized"
                 @resized="handleResized">

        <e-charts class="component-item" :ref="'component_' + option.i" :show-header="true"
                  v-if="(option.controlType == 'dashboard' || option.controlType == 'history') && option.type != 'status'"
                  :option="option" :device="device"></e-charts>

        <status class="component-item" :ref="'component_' + option.i" :show-header="true"
                v-if="option.controlType == 'dashboard' && option.type == 'status'" :option="option" :device="device"></status>

        <control class="component-item" :ref="'component_' + option.i" :show-header="true"
                 v-if="option.controlType == 'control'" :option="option" :device="device"></control>

      </grid-item>
    </grid-layout>

    <div v-else-if="status == pluginStatus.LOADING" class="plugin-loading">
      正在加载插件图表...
    </div>

    <div v-else-if="status == pluginStatus.NONE" class="plugin-loading">
      该设备未绑定插件，请绑定插件...
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

export default {
  name: "PluginCharts",
  components: {GridLayout, GridItem, ECharts, Control, Status},
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
      optionsData: [],
      // grid-layout的列数
      colNum: 24,
      pluginStatus: {
        LOADING: 0,
        LOADED: 1,
        NONE: 2
      },
      // 插件状态
      status: 0
    }
  },
  watch: {
    options: {
      handler(newValue) {
        if (newValue && newValue.length > 0) {
          let options = JSON.parse(JSON.stringify(newValue));
          this.getLayout(options, 4)
        } else {
          this.status = this.pluginStatus.NONE;
        }
      }
    }
  },
  mounted() {
  },
  methods: {
    handleResized(i) {
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
              }
              this.optionsData = options;
            } else {
              // 如果读取到的布局为空，则显示默认布局
              this.optionsData = this.getDefaultLayout(options, 4)
            }
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
      this.$nextTick(() => {
        newLayout.forEach(item => {
          this.$refs["component_" + item.i][0].sizeChange();
        })
        this.setLayout();
      })
    },
    /**
     * 1.遍历组件
     * 2.根据组件类型获取当前值/历史曲线值
     * 3.给组件赋值
     */
    getComponentMaps(options) {
      options.forEach(item => {
        console.log("====getComponentMaps", item)
        // if (item.controlType == "dashboard") {
        //
        // } else if (item.controlType == "dashboard")
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
.plugin-loading {
  color: #fff;
  font-size: 18px;
}
</style>