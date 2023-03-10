<template>
    <div class="chart-div" :style="getChartStyle()">
    <div  v-if="showHeader" class="chart-header">

      <span class="title">{{ optionData.name }}</span>
    </div>

    <div style="width: 100%; height:calc(100% - 60px);position: absolute;top:40px" ref="chart" id="echarts"></div>

    <el-dialog title="配置" width="30%"
        :visible.sync="configurationVisible">
      <span></span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="dialogVisible = false">确 定</el-button>
      </span>
    </el-dialog>

  </div>
</template>

<script>
import {  historyValue } from "@/api/device";
import "@/core/mixins/charts.js"

let Echarts = require('echarts/lib/echarts');
require('echarts/lib/chart/gauge');

export default {
  name: "Echarts",
  props: {
    showHeader: {
      type: [Boolean],
      default: false
    },
    option: {
      type: [Object],
      default: () => {return {}}
    },
    value: {
      type: [Object, String, Array],
      default: () => { return {} }
    },
    device: {
      type: [Object],
      default: () => {return {}}
    }
  },
  data() {
    return {
      myEcharts: {},
      controlType: "dashboard",
      optionData: {},
      configurationVisible: false,
      flushTime: 5,
      timer: null,
    }
  },
  watch: {
    value: {
      handler(newValue) {
      }
    }
  },
  mounted() {
    window.addEventListener("resize",() => {
      this.myEcharts.resize();
    });
    this.optionData = JSON.parse(JSON.stringify(this.option));
    this.controlType = this.optionData.controlType;
    this.initEChart();
  },

  methods: {
    /**
     * 加载EChats图表
     */
    initEChart(option) {
      this.myEcharts = Echarts.init(this.$refs.chart, 'dark');
      this.$nextTick(() => {
        this.myEcharts.resize();
        // this.sizeChange();
      });
      this.optionData.backgroundColor = 'transparent';
      if (option) {
        this.myEcharts.setOption(option);
      } else {
        this.myEcharts.setOption(this.optionData);
      }
    },
    /**
     * 更新图表的值
     * @param value
     */
    updateOption(value) {
      console.log("====更新图表的值", this.option)
      if (this.option.controlType == "dashboard") {
        let series = [];
        series = value.map(item => {
          let detail = { formatter: '{value}' + (item.unit != "-" ? item.unit : "") };
          return { data: [ { value: item.value } ], detail }
        })
        this.myEcharts.setOption({ series });
      }
    },
    /**
     * 修改 e-chart 大小
     */
    sizeChange(){
      let mainRef = this.$refs.chart;
      let width = mainRef.clientWidth;
      let height = mainRef.clientHeight;
      let length = Math.min(width, height);
      let option = this.resizeECharts(this.option, length);
      this.myEcharts.setOption(option)
        this.myEcharts.resize();
    },
    getChartStyle() {
      let style = this.optionData.style ? this.optionData.style : {};
      let backgroundColor = style.backgroundColor ? style.backgroundColor : "#2d3d86";
      console.log("getChartStyle", backgroundColor)
      return {
        backgroundColor
      }
    }
  },
}


</script>

<style scoped lang="scss">
.chart-div {
  position: relative;
  //margin: 10px 20px 20px 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  background-color: #2d3d86;
  border-radius: 4px;
}
.chart-header {
  position: relative;
  display: flex;
  width: 100%;
  height: 40px;
  padding-left: 10px;
  text-align: right;
  //box-shadow: 0 2px 0px 0 rgba(0, 0, 0, 0.1);
  .title {
    //width: 100%;
    //flex-grow: 1;
    color: #fff;
    text-align: center;
    margin-top: 10px;
    margin-bottom: 10px;
    font-size: 18px;
  }
  .tool-right {
    position: absolute;
    text-align: center;

    top:4px;
    right: 4px;
  }
  .tool-item {
    background: transparent!important;
    border: 0px solid transparent;
  }
}
</style>