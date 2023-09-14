<template>
  <div class="chart-div" :style="getChartStyle()">
    <div v-if="showHeader" class="chart-header">

      <span class="title">{{ optionData.name }}</span>
      <div class="tool-right">
        <status-icon ref="statusIconRef" :status="status"/>
        
        <!-- 采样周期  -->
        <el-dropdown @command="handlePeriodCommand">
          <el-button class="tool-item" size="mini" icon="el-icon-time"></el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item :class="getPeriodClass('custom')" command="custom">自定义区间</el-dropdown-item>
            <el-dropdown-item :class="getPeriodClass('300')" command="300">最近5分钟</el-dropdown-item>
            <el-dropdown-item :class="getPeriodClass('900')" command="900">最近15分钟</el-dropdown-item>
            <el-dropdown-item :class="getPeriodClass('1800')" command="1800">最近半小时</el-dropdown-item>
            <el-dropdown-item :class="getPeriodClass('3600')" command="3600">最近1小时</el-dropdown-item>
            <el-dropdown-item :class="getPeriodClass('10800')" command="10800">最近3小时</el-dropdown-item>
            <el-dropdown-item :class="getPeriodClass('86400')" command="86400">最近一天</el-dropdown-item>
            <el-dropdown-item :class="getPeriodClass('259200')" command="259200">最近三天</el-dropdown-item>
            <el-dropdown-item :class="getPeriodClass('604800')" command="604800">最近一周</el-dropdown-item>
            <el-dropdown-item :class="getPeriodClass('2592000')" command="2592000">最近一月</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>

        <!-- 采样区间 -->
        <!-- <el-button class="tool-item" size="mini" icon="el-icon-date" @click="handleShowRange"></el-button> -->

        <!-- 采样频率 -->
        <el-dropdown @command="handleFrequencyCommand">
          <el-button class="tool-item" size="mini" icon="el-icon-discover"></el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item :class="getFrequencyClass('no_aggregate')" command="no_aggregate">不聚合</el-dropdown-item>
            <el-dropdown-item :class="getFrequencyClass('5')" command="5">5秒</el-dropdown-item>
            <el-dropdown-item :class="getFrequencyClass('10')" command="10">10秒</el-dropdown-item>
            <el-dropdown-item :class="getFrequencyClass('30')" command="30">30秒</el-dropdown-item>
            <el-dropdown-item :class="getFrequencyClass('60')" command="60">1分钟</el-dropdown-item>
            <el-dropdown-item :class="getFrequencyClass('300')" command="300">5分钟</el-dropdown-item>
            <el-dropdown-item :class="getFrequencyClass('600')" command="600">10分钟</el-dropdown-item>
            <el-dropdown-item :class="getFrequencyClass('1800')" command="1800">半小时</el-dropdown-item>
            <el-dropdown-item :class="getFrequencyClass('3600')" command="3600">1小时</el-dropdown-item>
            <el-dropdown-item :class="getFrequencyClass('10800')" command="10800">3小时</el-dropdown-item>
            <el-dropdown-item :class="getFrequencyClass('86400')" command="86400">1天</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>

        <!-- 聚合选项 -->
        <el-dropdown v-if="params.rate!=='no_aggregate'" @command="handleAggregateCommand">
          <el-button class="tool-item" size="mini" icon="el-icon-connection"></el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item :class="getAggregateClass('average')" command="average">平均值</el-dropdown-item>
            <el-dropdown-item :class="getAggregateClass('maximum')" command="maximum">最大值</el-dropdown-item>
            <el-dropdown-item :class="getAggregateClass('minimum')" command="minimum">最小值</el-dropdown-item>
            <el-dropdown-item :class="getAggregateClass('median')" command="median">中位数</el-dropdown-item>
            <el-dropdown-item :class="getAggregateClass('first')" command="first">首位数</el-dropdown-item>
            <el-dropdown-item :class="getAggregateClass('last')" command="last">末尾数</el-dropdown-item>
            <el-dropdown-item :class="getAggregateClass('range')" command="range">首尾差值</el-dropdown-item>
            <el-dropdown-item :class="getAggregateClass('count')" command="count">次数统计</el-dropdown-item>
            <el-dropdown-item :class="getAggregateClass('sum')" command="sum">求和</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <el-button class="tool-item" size="mini" icon="el-icon-more" @click="showConfiguration"></el-button>
      </div>

    </div>

    <div style="width: 100%; height:calc(100% - 60px);position: absolute;top:40px;bottom:20px" ref="chart"></div>

    <el-dialog class="el-dark-dialog" title="配置" width="30%" :append-to-body="true" :visible.sync="configurationVisible">
      <span></span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="configurationVisible = false">取 消</el-button>
        <el-button type="primary" @click="configurationVisible = false">确 定</el-button>
      </span>
    </el-dialog>

    <el-dialog class="range-dialog" title="采样区间" width="500px" :append-to-body="true" :visible.sync="rangeDialogVisible">
      <el-form>
        <el-row>
          <el-col :span="12">
            <el-date-picker v-model="range.startTime" type="datetime" placeholder="选择起始时间" align="right"
              :picker-options="pickerOptions">
            </el-date-picker>
          </el-col>

          <el-col :span="12">
            <el-date-picker v-model="range.endTime" type="datetime" placeholder="选择结束时间" align="right"
              :picker-options="pickerOptions">
            </el-date-picker>
          </el-col>
        </el-row>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="rangeDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleRangeSubmit">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { historyValue, statistic } from "@/api/device";
import StatusIcon from "./StatusIcon"
import { dateFormat } from "@/utils/tool.js"

export default {
  name: "Curve.vue",
  components: { StatusIcon },
  props: {
    showHeader: {
      type: [Boolean],
      default: false
    },
    option: {
      type: [Object],
      default: () => { return {} }
    },
    value: {
      type: [Object, String, Array],
      default: () => { return {} }
    },
    device: {
      type: [Object],
      default: () => { return {} }
    },
    status: {
      type: [Boolean],
      default: false
    }
  },
  data() {
    return {
      myEcharts: {},
      optionData: {},
      configurationVisible: false,
      rangeDialogVisible: false,
      dataZoom: {
        start: 70,
        end: 100
      },
      params: {
        period: 300,   // 采样周期，默认最近5分钟
        rate: "no_aggregate",     // 采样频率，默认10秒
        aggregate: "average"
      },
      pickerOptions: {
        disabledDate(time) {
          return time.getTime() > Date.now();
        },
        shortcuts: [
          {
            text: '今天',
            onClick(picker) {
              picker.$emit('pick', new Date());
            }
          }, 
          {
            text: '昨天',
            onClick(picker) {
              const date = new Date();
              date.setTime(date.getTime() - 3600 * 1000 * 24);
              picker.$emit('pick', date);
            }
          }, 
          {
            text: '一周前',
            onClick(picker) {
              const date = new Date();
              date.setTime(date.getTime() - 3600 * 1000 * 24 * 7);
              picker.$emit('pick', date);
            }
          },
          {
            text: '一月前',
            onClick(picker) {
              const date = new Date();
              date.setTime(date.getTime() - 3600 * 1000 * 24 * 30);
              picker.$emit('pick', date);
            }
          }
        ]
      },
      range: {
        startTime: '',
        endTime: '',
      },
      requesting: false
    }
  },
  mounted() {
    window.addEventListener("resize", () => {
      this.myEcharts.resize();
    });
    this.optionData = JSON.parse(JSON.stringify(this.option));
    this.controlType = this.optionData.controlType;
    this.initEChart();
    this.myEcharts.on('dataZoom', params => {
      this.dataZoom.start = params.start;
      this.dataZoom.end = params.end;
    })
    
  },
  computed: {
    getFrequencyClass() {
      return (v) => this.params.rate.toString() === v.toString() ? 'active' : 'noActive'
    },
    getPeriodClass() {
      return (v) => this.params.period.toString() === v.toString() ? 'active' : 'noActive'
    },
    getAggregateClass() {
      return (v) => this.params.aggregate.toString() === v.toString() ? 'active' : 'noActive'
    }
  },
  methods: {
    /**
     * 加载EChats图表
     */
    initEChart(option) {
      this.myEcharts = this.$echarts.init(this.$refs.chart, 'dark');
      this.$nextTick(() => {
        this.myEcharts.resize();
      });
      
      this.optionData.tooltip = {
        trigger: 'axis',
        confine: true,
      };
      this.optionData.backgroundColor = 'transparent';
      if (option && option.series[0].data) {
        const data = option.series[0].data;
        // let start = Math.ceil(this.dataZoom.start / 100 * data.length);
        // let end = Math.floor(this.dataZoom.end / 100 * data.length);
        // let displayedData = data.slice(start - 1, end + 1);
        let min = Math.floor(Math.min.apply(null, data));
        let max = Math.ceil(Math.max.apply(null, data));
        option.yAxis = option.yAxis ? option.yAxis : {};
        option.yAxis.max = max;
        option.yAxis.min = min;
        this.myEcharts.setOption(option);
        this.$refs.statusIconRef.flush();
      } else {
        this.myEcharts.setOption(this.optionData);
      }
    },
    async getStatistic(mapping) {
      let attrs = mapping.map(item => item.name ? item.name : item);
      if (!attrs || attrs.length == 0) return;

      let endTime = (new Date()).getTime();
      let startTime = endTime - (Number(this.params.period) * 1000);

      // 如果有选择时间区间，则以选择的时间区间为准
      if (this.range.startTime && this.range.endTime) {
        startTime = new Date(this.range.startTime).getTime();
        endTime = new Date(this.range.endTime).getTime();
      }
      
      let params = {
          device_id: this.device.device,
          key: attrs[0],
          start_time: startTime * 1000,
          end_time: endTime * 1000,
          aggregate_window: "no_aggregate",
          time_range: "last_3h"
      }

      this.requesting = true;
      let { data: result } = await statistic(params);
      this.requesting = false;
      let sysTimes = [];
      let data = [];
      try {
        result.data.time_series.reverse().forEach(item => {
          sysTimes.push(dateFormat(item.x));
          data.push(item.y)
        })
        let xAxis = { data: sysTimes, type: 'category', axisLabel: { interval: 'auto' } };
        let series = [
          {
            data,
            type: 'line'
          }
        ]
        this.initEChart({ xAxis, series});
      } catch(err) {

      }
      
    },
    /**
     * 从服务器获取指定设备的推送数据
     * @param deviceId
     * @param attrs
     */
    async getHistory(mapping) {
      if (!this.requesting) {
        this.getStatistic(mapping);
      }
    },

    handleShowRange() {
      this.rangeDialogVisible = true;
    },
    handleRangeSubmit() {
      // 格林威治时间转为时间戳
      if (!this.range.startTime || !this.range.endTime) {
        this.$message.error("请选择时间区间");
        return;
      }
      this.rangeDialogVisible = false;
      this.getHistory(this.optionData.mapping);
    },
    /**
     * 采样周期
     * @param command
     */
    handlePeriodCommand(command) {
      this.params.period = command;
      if (command === "custom") {
        this.rangeDialogVisible = true;
        return;
      }
      let endTime = (new Date()).getTime();
      let startTime = endTime - (Number(this.params.period) * 1000);
      this.range = { startTime, endTime }
      console.log("handlePeriodCommand", command)
      this.getHistory(this.optionData.mapping)
    },
    /**
     * 采样频率
     * @param command
     */
    handleFrequencyCommand(command) {
      this.params.rate = command;
      this.getHistory(this.optionData.mapping)
    },
    handleAggregateCommand(command) {
      this.params.aggregate = command;
    },
    showConfiguration() {
    },
    /**
     * 修改 e-chart 大小
     */
    sizeChange() {
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
    },
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
  z-index: 9999;
  //box-shadow: 0 2px 0px 0 rgba(0, 0, 0, 0.1);
  .title {
    //width: 100%;
    //flex-grow: 1;
    display: flex;
    align-items: center;
    color: #fff;
    text-align: center;
    margin-top: 10px;
    margin-bottom: 10px;
    font-size: 18px;
  }

  .tool-right {
    position: absolute;
    display: flex;
    text-align: center;
    top: 4px;
    right: 4px;
  }

  .tool-item {
    background: transparent !important;
    border: 0px solid transparent;
      
  }

}
::v-deep .el-dropdown-menu__item.active {
  font-weight: 800!important;
  background-color: #ecf5ff;
  // color: #66b1ff;
}
</style>