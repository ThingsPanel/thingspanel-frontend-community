<template>
  <div class="chart-div" :style="getChartStyle()">
    <div  v-if="showHeader" class="chart-header">

      <span class="title">{{ optionData.name }}</span>
      <div class="tool-right">

        <!-- 采样周期  -->
        <el-dropdown @command="handlePeriodCommand">
          <el-button class="tool-item" size="mini" icon="el-icon-time"></el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="300">最近5分钟</el-dropdown-item>
            <el-dropdown-item command="900">最近15分钟</el-dropdown-item>
            <el-dropdown-item command="1800">最近半小时</el-dropdown-item>
            <el-dropdown-item command="3600">最近1小时</el-dropdown-item>
            <el-dropdown-item command="10800">最近3小时</el-dropdown-item>
            <el-dropdown-item command="86400">最近一天</el-dropdown-item>
            <el-dropdown-item command="259200">最近三天</el-dropdown-item>
            <el-dropdown-item command="604800">最近一周</el-dropdown-item>
            <el-dropdown-item command="2592000">最近一月</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>

        <!-- 采样频率 -->
        <el-dropdown @command="handleFrequencyCommand">
          <el-button class="tool-item" size="mini" icon="el-icon-discover"></el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="5">5秒</el-dropdown-item>
            <el-dropdown-item command="10">10秒</el-dropdown-item>
            <el-dropdown-item command="30">30秒</el-dropdown-item>
            <el-dropdown-item command="60">1分钟</el-dropdown-item>
            <el-dropdown-item command="300">5分钟</el-dropdown-item>
            <el-dropdown-item command="1800">半小时</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
<!--        <el-button v-if="optionData.controlType == 'history'" class="tool-item" size="mini" icon="el-icon-picture-outline"></el-button>-->

        <el-button class="tool-item" size="mini" icon="el-icon-more" @click="showConfiguration"></el-button>
      </div>

    </div>

    <div style="width: 100%; height:calc(100% - 60px);position: absolute;top:40px;bottom:20px" ref="chart"></div>

    <el-dialog title="配置" width="30%"
               :visible.sync="configurationVisible">
      <span></span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="configurationVisible = false">取 消</el-button>
        <el-button type="primary" @click="configurationVisible = false">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {  historyValue } from "@/api/device";

// let Echarts = require('echarts/lib/echarts');

export default {
  name: "Curve.vue",
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
      optionData: {},
      configurationVisible: false,
      params: {
        period: 300,   // 采样周期，默认最近5分钟
        rate: 10     // 采样频率，默认10秒
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
      console.log("====Curve.option", option)
      console.log("====Curve.optionData", this.optionData)
      this.myEcharts = this.$echarts.init(this.$refs.chart, 'dark');
      this.$nextTick(() => {
        this.myEcharts.resize();
      });
      this.optionData.backgroundColor = 'transparent';
      if (option) {
        this.myEcharts.setOption(option);
      } else {
        this.myEcharts.setOption(this.optionData);
      }
    },
    /**
     * 从服务器获取指定设备的推送数据
     * @param deviceId
     * @param attrs
     */
    getHistory(mapping) {
      let attrs = mapping.map(item => item.name ? item.name : item);
      if (!attrs || attrs.length == 0) return;
      let now = (new Date()).getTime();
      let lastTime = now - (Number(this.params.period) * 1000);
      // let startTime = endTime-246060*1000;
      let rate = this.params.rate * 1000 * 1000;  // 微秒
      let attribute = attrs.concat(["systime"])
      let params = {
        device_id: this.device.device,
        attribute,
        "start_ts": lastTime,
        "end_ts": now,
        rate: rate + ""
      }
      historyValue(params)
          .then(({data}) => {
            if (data.code == 200) {
              let series = [];
              let sysTimes = [];
              if (data.data && JSON.stringify(data.data) != "{}") {
                for (let i = 0; i < attrs.length; i++) {
                  series.push({ data: data.data ? data.data[attrs[i]] : 0, type: "line"})
                }
                // sysTimes = data.data.systime.map(item => item = item.substring(12))
                sysTimes = data.data.systime;
              }

              let xAxis = {data: sysTimes, type: 'category'} ;
              let option = { series, xAxis };
              this.initEChart(option);
            }
          })
    },
    /**
     * 采样周期
     * @param command
     */
    handlePeriodCommand(command) {
      this.params.period = Number(command);
      this.getHistory(this.optionData.mapping)
    },
    /**
     * 采样频率
     * @param command
     */
    handleFrequencyCommand(command) {
      this.params.rate = Number(command);
      this.getHistory(this.optionData.mapping)
    },
    showConfiguration() {
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
  }
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