<template>
  <div class="detail-box">
    <el-dialog class="el-dark-dialog el-dark-input" :title="pluginName" :visible.sync="dialogVisible" width="1000px">
        <div class="container-fluid">
          <el-row :gutter="40">
            <el-col :span="24">
              <tsl-editor class="tsl-editor" :show-view="false" :show-create="true" :data="tslData" @gotoPlugin="handleGotoPlugin"></tsl-editor>
            </el-col>
          </el-row>

          <el-row :gutter="40">
            <el-col :span="24">
                <grid-layout class="grid-box"
                    :layout.sync="optionsData" :col-num="colNum" :row-height="30"
                    :is-draggable="true" :is-resizable="true" :is-mirrored="false"
                    :vertical-compact="true" :margin="[10, 10]" :use-css-transforms="true"
                >

                <grid-item class="grid-item" v-for="(option, index) in optionsData" :key="option['id'] + index"
                    :x="option.x"
                    :y="option.y"
                    :w="option.w"
                    :h="option.h"
                    :i="option.i"
                    >

                    <e-charts class="component-item" :ref="'component_' + option.i" :key="option['id']" :show-header="true"
                            v-if="option.controlType == 'dashboard' && !option.type"
                            :option="option"  :value="option.value"></e-charts>

                    <curve class="component-item" :ref="'component_' + option.i" :key="option['id']" :show-header="true"
                        v-if="option.controlType == 'history'"
                        :option="option"  :value="option.value"></curve>

                    <status class="component-item" :ref="'component_' + option.i" :key="option['id']" :show-header="true"
                            v-if="option.controlType == 'dashboard' && option.type == 'status'" :option="option" ></status>

                    <device-status class="component-item" :ref="'component_' + option.i" :key="option['id']" :show-header="true"
                            v-if="option.controlType == 'dashboard' && option.type == 'deviceStatus'"
                                :option="option" :value="option.value"></device-status>

                    <control class="component-item" :ref="'component_' + option.i" :key="option['id']" :show-header="true"
                            v-if="option.controlType == 'control'" :option="option" ></control>

                    <video-component class="component-item" style="min-width: 200px;min-height: 200px" :ref="'component_' + option.i"
                                    :key="option['id']" :show-header="true"
                            v-if="option.controlType == 'video'" :option="option"></video-component>

                </grid-item>
                </grid-layout>
            </el-col>
          </el-row>
    
        </div>
    
        <span slot="footer" class="dialog-footer">
            <el-button type="cancel" @click="dialogVisible = false">关闭</el-button>
          </span>
      </el-dialog>
  </div>
</template>

<script>
import PluginAPI from "@/api/plugin.js"
import { GridLayout, GridItem } from "vue-grid-layout";
import ECharts from "@/view/pages/device-watch/device-detail/components/Echarts"
import Curve from "@/view/pages/device-watch/device-detail/components/Curve";
import Control from "@/view/pages/device-watch/device-detail/components/Control";
import Status from "@/view/pages/device-watch/device-detail/components/Status"
import DeviceStatus from "@/view/pages/device-watch/device-detail/components/DeviceStatus"
import VideoComponent from "@/view/pages/device-watch/device-detail/components/Video";

export default {
  components: {
    GridLayout, GridItem, ECharts, Curve, Control, Status, DeviceStatus, VideoComponent
  },
  props: {
    visible: {
        type: [Boolean],
        default: false
    },
    id: {
        type: [String],
        default: ""
    }
  },
  data() {
    return {
        tslData: {},
        chartData: {},
        optionsData: [],
        colNum: 24,
        pluginName: ""
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit("update:visible", val);
      }
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.getPluginData(this.id)
      }
    }
  },
  methods: {
    /**
     * 通过插件id获取插件数据
     * @param pluginId
     */
     getPluginData(pId) {
      PluginAPI.page({"current_page": 1, "per_page": 10, "id": pId})
          .then(({data: result}) => {
            if (result.code == 200) {
              const data = result.data.data[0];
              this.pluginName = data.model_name;
              const jsonObj = JSON.parse(data?.chart_data || "{}");
              this.tslData = jsonObj.tsl || {}
              let chartData = jsonObj.chart || [];
              this.optionsData = this.getDefaultLayout(chartData, 4);
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
    handleGotoPlugin() {
      this.$router.push( { name: "Market", query: { tab: "deviceEditor" }})
    }
  }
}
</script>
<style lang="scss" scoped>
.el-dialog__wrapper {
    z-index: 2999!important;
}
.grid-box {
    width: 100%;
    height: 100%;
    min-height:225px;
}
.component-item {
    width: 100%;
    height: 100%;
    //position: absolute;
    top: 0;
    left: 0;
  }
</style>