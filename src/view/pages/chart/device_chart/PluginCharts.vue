<template>
  <div style="width: 100%;height: 100%">
    <grid-layout style="width: 100%;height: 100%"
        :layout.sync="optionsData" :col-num="15" :row-height="30"
        :is-draggable="true" :is-resizable="true" :is-mirrored="false"
        :vertical-compact="true" :margin="[10, 10]" :use-css-transforms="true">

      <grid-item class="grid-item" v-for="option in optionsData" :key="option['id']"
                 :x="option.x"
                 :y="option.y"
                 :w="option.w"
                 :h="option.h"
                 :i="option.i"
                 @moved="handleResized"
                 @resized="handleResized">

        <e-charts style="width: 100%;height: 100%;" :ref="'component_' + option['i']"
                  v-if="(option.controlType == 'dashboard' || option.controlType == 'history') && option.type != 'status'"
                  :option="option" :device="device"></e-charts>

        <status style="width: 100%;height: 100%;" :ref="'component_' + option['i']"
                v-if="option.controlType == 'dashboard' && option.type == 'status'" :option="option" :device="device"></status>

        <control style="width: 100%;height: 100%;" :ref="'component_' + option['i']"
                 v-if="option.controlType == 'control'" :option="option" :device="device"></control>

      </grid-item>
    </grid-layout>
  </div>

</template>

<script>
import {GridLayout, GridItem} from "vue-grid-layout";
import ECharts from "./Echarts"
import Control from "./Control";
import Status from "./Status"
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
      optionsData: []
    }
  },
  watch: {
    options: {
      handler(newValue) {
        console.log("PluginCharts.options1", newValue)
        let options = JSON.parse(JSON.stringify(newValue))
        for (let i = 0; i < this.options.length; i++) {
          options[i].x = options[i].y = 0;
          options[i].w = 4;
          options[i].h = 6;
          options[i].i = i;
        }
        this.optionsData = options;
        this.getLayout();
      }
    }
  },
  methods: {
    handleResized(i, w, h) {
      this.$refs["component_" + i][0].sizeChange();
      this.setLayout();
    },
    getLayout() {
      console.log("getLayout.device", this.device)
      device_info({id: this.device.device })
        .then(({data}) => {
          if (data.code == 200) {
            let layout = JSON.parse(data.data['chart_option']);
            console.log("getLayout.layout", layout)
            let options = JSON.parse(JSON.stringify(this.optionsData));
            for (let i = 0; i < this.options.length; i++) {
              let option = layout.find(item => item.id == this.options[i].id)
              if (!option) {
                option = {x: 0, y: 0, w: 4, h: 6, i}
              }
              options[i].x = option.x;
              options[i].y = option.y;
              options[i].w = option.w;
              options[i].h = option.h;
              options[i].i = option.i;
            }
            console.log("getLayout.options", options)
            this.optionsData = options;
          }
        })
    },
    setLayout() {
      let layout = this.optionsData.map(item => {
        return { x: item.x, y: item.y, w: item.w, h: item.h, i: item.i, id: item.id }
      })
      console.log("setLayout", layout)
      device_update({id: this.device.device, chart_option: JSON.stringify(layout) })
        .then(res => {
          console.log("setLayout", res)
        })
    }
  }
}
</script>

<style scoped>
.grid-item {
  width: 360px;
  height: 360px;
  /*background-color: #cc0000;*/
}
</style>