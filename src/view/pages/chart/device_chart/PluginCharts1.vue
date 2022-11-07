<!-- 点击设备默认显示插件图表 -->
<template>
  <div style="width: 100%;height: 100%">
<!--    <grid-layout style="width: 100%;height: 100%"-->
<!--        :layout.sync="optionsData" :col-num="15" :row-height="30"-->
<!--        :is-draggable="true" :is-resizable="true" :is-mirrored="false"-->
<!--        :vertical-compact="true" :margin="[10, 10]" :use-css-transforms="true"-->
<!--         @layout-updated="handleLayoutUpdatedEvent"-->
<!--    >-->

<!--      <grid-item class="grid-item" v-for="option in optionsData" :key="option['id']"-->
<!--                 :x="option.x"-->
<!--                 :y="option.y"-->
<!--                 :w="option.w"-->
<!--                 :h="option.h"-->
<!--                 :i="option.i"-->
<!--                 @moved="handleResized"-->
<!--                 @resized="handleResized">-->

<!--        <e-charts class="component-item" :ref="'component_' + option.i"-->
<!--                  v-if="(option.controlType == 'dashboard' || option.controlType == 'history') && option.type != 'status'"-->
<!--                  :option="option" :device="device"></e-charts>-->

<!--        <status class="component-item" :ref="'component_' + option.i"-->
<!--                v-if="option.controlType == 'dashboard' && option.type == 'status'" :option="option" :device="device"></status>-->

<!--        <control class="component-item" :ref="'component_' + option.i"-->
<!--                 v-if="option.controlType == 'control'" :option="option" :device="device"></control>-->

<!--      </grid-item>-->
<!--    </grid-layout>-->
    <div class="chart-container">
      <div class="chart-item" v-for="option in optionsData" :key="option['id']" :ref="'item_' + option['id']">
        <e-charts class="component-item" :ref="'component_' + option['id']"
                  v-if="(option.controlType == 'dashboard' || option.controlType == 'history') && option.type != 'status'"
                  :option="option" :device="device"></e-charts>

        <status class="component-item" :ref="'component_' + option['id']"
                v-if="option.controlType == 'dashboard' && option.type == 'status'" :option="option" :device="device"></status>

        <control class="component-item" :ref="'component_' + option['id']"
                 v-if="option.controlType == 'control'" :option="option" :device="device"></control>
      </div>
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
        this.getLayout();
        this.handleResized();
      }
    }
  },
  mounted() {

  },
  methods: {
    handleResized() {
      this.$nextTick(() => {
        console.log("$nextTick", this.optionsData)
        this.optionsData.forEach(item => {
          console.log("component_" + item.id , this.$refs["item_" + item.id][0].offsetWidth)
          console.log("component_" + item.id , this.$refs["item_" + item.id][0].offsetHeight)
          // console.log("component_" + item.i + "X", this.$refs["component_" + item.id][0].offsetWidth)
          // console.log("component_" + item.i + "Y", this.$refs["component_" + item.id][0].offsetHeight)
        })
      })
    },
    getLayout() {
      // device_info({id: this.device.device })
      //   .then(({data}) => {
      //     if (data.code == 200) {
      //       let layout = JSON.parse(data.data['chart_option']);
      //       let options = JSON.parse(JSON.stringify(this.optionsData));
      //       for (let i = 0; i < this.options.length; i++) {
      //         let option = layout.find(item => item.id == this.options[i].id)
      //         if (!option) {
      //           option = {x: 0, y: 0, w: 4, h: 6, i}
      //         }
      //         options[i].x = option.x;
      //         options[i].y = option.y;
      //         options[i].w = option.w;
      //         options[i].h = option.h;
      //         options[i].i = option.i;
      //       }
      //       this.optionsData = options;
      //     }
      //   })

    },
    setLayout() {
      let layout = this.optionsData.map(item => {
        return { x: item.x, y: item.y, w: item.w, h: item.h, i: item.i, id: item.id }
      })
      console.log("setLayout", layout)
      device_update({id: this.device.device, chart_option: JSON.stringify(layout) })
        .then(res => {})
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