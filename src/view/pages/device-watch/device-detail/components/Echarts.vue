<template>
  <div class="chart-div" :style="getChartStyle()">
    <div  v-if="showHeader" class="chart-header">

      <span class="title">{{ optionData.name }}</span>
      <div class="tool-right">
        <status-icon ref="statusIconRef" :status="status"/>
      </div>
    </div>

    <div class="echarts" style="width: 100%; height:100%;position: absolute;top:0px;padding:6px" ref="chart" id="echarts"></div>

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
import "@/core/mixins/charts.js"
import StatusIcon from "./StatusIcon"
let Echarts = require('echarts/lib/echarts');
require('echarts/lib/chart/gauge');

export default {
  name: "Echarts",
  components: {StatusIcon},
  props: {
    showHeader: {
      type: [Boolean],
      default: false
    },
    option: {
      type: [Object],
      default: () => ({})
    },
    value: {
      type: [Object, String, Array],
      default: () => ({})
    },
    device: {
      type: [Object],
      default: () => ({})
    },
    status: {
      type: [Boolean, Object],
      default: () => ({})
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
      if (this.option.controlType == "dashboard") {
        try {
          let name = "";
          if (this.option.series[0] && this.option.series[0].data[0] && this.option.series[0].data[0].name) {
            name = this.option.series[0].data[0].name ;
          }
          let series = [];
          series = value.map((item, i) => {
            if (!item.value) {
              let opts = this.myEcharts.getOption();
              let { data } = opts.series[i];
              let detail = { formatter: '无数据' };
              if (data && data[0]) {
                let detail = { formatter: '{value}' + ((item.unit && item.unit !== "-") ? item.unit : "") };
                return { data: [ { value: data[0].value, name } ], detail }
              } else {
                detail = { formatter: '无数据' };
                return { data: [ { value: "", name } ], detail }
              }
            } else {
              let detail = { formatter: '{value}' + ((item.unit && item.unit !== "-") ? item.unit : "") };
              return { data: [ { value: item.value, name } ], detail }
            }
          })
          this.myEcharts.setOption({ series });
          this.$refs.statusIconRef.flush()
        } catch (e) {
        }
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
  z-index: 9999;
  //box-shadow: 0 2px 0px 0 rgba(0, 0, 0, 0.1);
  .title {
    display: flex;
    align-items: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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