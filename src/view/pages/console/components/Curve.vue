<template>
  <div class="chart-div" :style="getChartStyle()"  >
    <div v-if="showHeader" class="chart-header">
      <dashboard-title :mode="mode" :value.sync="optionData.name"></dashboard-title>
    
      <div class="tool-right" v-if="mode!=='edit'">
        <status-icon ref="statusIconRef" :status="deviceStatus" />

        <!-- 采样区间 如最近5分钟，最近30分钟  -->
        <el-dropdown @command="handlePeriodCommand">
          <el-button class="tool-item" size="mini" icon="el-icon-time"></el-button>
          <el-dropdown-menu slot="dropdown">
            <!-- <el-dropdown-item :class="getPeriodClass('custom')" command="custom">自定义区间</el-dropdown-item> -->
            <el-dropdown-item v-for="(item, index) in periodList" :key="index" :class="getPeriodClass(item.key)" :command="item.key">{{ item.label }}</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>

        <!-- 采样区间 -->
        <!-- <el-button class="tool-item" size="mini" icon="el-icon-date" @click="handleShowRange"></el-button> -->

        <!-- 聚合间隔 如不聚合，30秒，1分钟 -->
        <el-dropdown @command="handleAggregateWindowCommand">
          <el-button class="tool-item" size="mini" icon="el-icon-discover"></el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item v-for="(item, index) in getAggregateWindowList" :key="index" :class="getAggregateWindowClass(item.key)" 
              :command="item.key" :disabled="item.disabled">{{item.label}}</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>

        <!-- 聚合方法 如：平均值，最大值，最小值... -->
        <el-dropdown v-if="params.aggregate_window !== 'no_aggregate'" @command="handleAggregateFuncCommand">
          <el-button class="tool-item" size="mini" icon="el-icon-connection"></el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item v-for="(item, index) of aggregateFuncList" :key="index" :class="getAggregateFuncClass(item.key)" 
              :command="item.key" :disabled="item.disabled">{{item.label}}</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>

        <!-- 刷新 -->
        <el-button v-if="params.aggregate_window !== 'no_aggregate'" class="tool-item" size="mini" icon="el-icon-refresh" @click="handleRefresh"></el-button>

      </div>
      <div v-else class="tool-right">
        <el-button v-if="showConfig" class="tool-item" style="padding-top: 2px" size="mini" icon="el-icon-setting" @click="showConfiguration"/>
        <slot ></slot>

      </div>
    </div>

    <div style="width: 100%; height:calc(100% - 60px);position: absolute;top:40px;bottom:20px" ref="chart" @click="handleClick"></div>

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
import { statisticBatch } from "@/api/device";
import StatusIcon from "./StatusIcon"
import DashboardTitle from "./DashboardTitle.vue"
import Vue from "vue";
import { dateFormat } from "@/utils/tool.js"
import { PeriodList, AggregateFuncList, getAggregateWindowList, calcAggregate, getSeries } from "./Const.js"
import { commonProps, LoadingState } from "./Const";
export default {
  name: "Curve",
  components: { StatusIcon, DashboardTitle  },
  props: {
    ...commonProps
  },
  data() {
    return {
      myEcharts: {},
      optionData: {},
      configurationVisible: false,
      rangeDialogVisible: false,
      dataZoom: {
        start: 0,
        end: 100
      },
      params: {
        // 采样周期，默认最近1小时
        period: 3600,   
        // 聚合方法
        aggregate_function: "avg",     
        // 聚合间隔
        aggregate_window: "no_aggregate"    
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
      // 曲线图加载状态
      loadingState: LoadingState.UNRENDERED,
      // 采样区间列表
      periodList: PeriodList,
      // 聚合方法列表
      aggregateFuncList: AggregateFuncList,
      deviceStatus: {}
    }
  },
  mounted() {
    // 状态置为未渲染
    this.loadingState = LoadingState.UNRENDERED;
    window.addEventListener("resize", () => {
      this.myEcharts && this.myEcharts.resize();
    });
    this.optionData = JSON.parse(JSON.stringify(this.option));
    this.controlType = this.optionData.controlType;
    this.initEChart();
  },
  computed: {
    getAggregateWindowList() {
        if (this.params.period === "custom") {
          if (this.range.startTime && this.range.endTime) {
            const periodKey = calcAggregate(this.range.startTime, this.range.endTime)
            const list = getAggregateWindowList(periodKey);
            this.params.aggregate_window = list.sel;
            return list.list;
          }
        } else {
          const list = getAggregateWindowList(this.params.period);
          // console.log("getAggregateWindowList", list)
          this.params.aggregate_window = list.sel;
          return list.list;
        }
    },
    getAggregateWindowClass() {
      return (v) => this.params.aggregate_window.toString() === v.toString() ? 'active' : 'noActive'
    },
    getPeriodClass() {
      return (v) => this.params.period.toString() === v.toString() ? 'active' : 'noActive'
    },
    getAggregateFuncClass() {
      return (v) => this.params.aggregate_function.toString() === v.toString() ? 'active' : 'noActive'
    }
  },
  watch: {
    "optionData.name": {
      handler(newValue) {
        if (!newValue) return;
        this.$emit("changeName", newValue)
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    /**
     * 加载EChats图表
     */
    initEChart() {
      console.log("====initEChart", this.loadingState);
      this.myEcharts = this.$echarts.init(this.$refs.chart, 'dark');
      this.myEcharts && this.myEcharts.on('dataZoom', params => {
        this.dataZoom.start = params.start;
        this.dataZoom.end = params.end;
      })
      this.$nextTick(() => {
        this.myEcharts.resize();
      });

      this.optionData.tooltip = { trigger: 'axis', confine: true };
      this.optionData.backgroundColor = 'transparent';
      this.myEcharts.setOption(this.optionData);
      // 图表已完成渲染
      // this.myEcharts.on('finished', () => {
      //   this.loadingState = LoadingState.FINISHED;
      //   console.log("====initEChart", this.loadingState);
      // });
    },
    /**
     * @description: 改变数据
     * @param {*} series
     * @return {*}
     */    
    changeData(series) {
      const xAxis = { type: "time" };
      const yAxis = { type: "value", max: "dataMax", min: "dataMin" };
      this.myEcharts && this.myEcharts.setOption({ xAxis, yAxis, series });
      this.$refs.statusIconRef?.flush();
    },
    /**
     * @description: 更新图表的值
     * @param {*} values
     * @return {*}
     */    
    updateOption(values) {
      if (this.params.aggregate_window !== "no_aggregate" || this.loadingState !== LoadingState.FINISHED) return;
      var currentOption = this.myEcharts.getOption();
      let series = [];
      for (let i = 0; i < currentOption.series.length; i++) {
        let data = JSON.parse(JSON.stringify(currentOption.series[i])).data;

        let value = values[this.optionData.mapping[i]]
        var timestamp = new Date(values["systime"]).getTime();
        if (!data) {
          data = [];
        }
      
        let len = data.push([timestamp, value]);
        // 如果长度大于100且第一个数据和最后一个数据的间隔时间大于采样周期则删除最后一个元素
        if (len >= 100 && timestamp - data[len -1][0] > this.params.period * 1000) {
          data.shift();
        }
        series.push({ 
          type: "line",
          symbol: 'none', // 设置坐标点样式为空
          symbolSize: 0,
          smooth: true, 
          animation: false,  // 开启动画效果
          animationDuration: 1000,  // 动画持续时间为1秒
          animationEasing: 'quadraticOut',
          areaStyle: {
              color: 'rgba(0, 128, 255, 0.3)'  // 填充颜色和透明度
          },
          data 
        })
      }
      this.changeData(series);
    },
    /**
     * 从服务器获取指定设备的推送数据
     * @param deviceId
     * @param attrs
     */
     async getHistory() {
      if (true || this.loadingState === LoadingState.FINISHED) {
        // 如果已渲染完成或已加载完毕
        try {
          this.myEcharts.showLoading({
            text: "数据加载中...",
            color: "#3174F2",
            textColor: "#ffffc2",
            maskColor: "rgba(255, 255, 255, 0)",
            zlevel: 0
          }); 
          setTimeout(async () => {
            await this.getStatistic(this.option.dataSource);
            this.myEcharts.hideLoading();
          }, 500);
        } catch(err) {}
      }
    },
    /**
     * @description: 
     * @param {*} mapping
     * @return {*}
     */    
    async getStatistic(mapping) {
      let attrs = mapping.map(item => item.name ? item.name : item);
      if (!attrs || attrs.length == 0) return;
      let endTime = (new Date()).getTime();
      let startTime = endTime - (Number(this.params.period) * 1000);
      // 如果有选择时间区间，则以选择的时间区间为准
      if (this.params.period === "custom" && this.range.startTime && this.range.endTime) {
        startTime = new Date(this.range.startTime).getTime();
        endTime = new Date(this.range.endTime).getTime();
      }
      if (!startTime || !endTime) return;
      
      let d = mapping.map(item => {
        return {
          device_id: this.device.deviceId,
          key: item.name ? item.name : item
        }
      });
      let params = {
          data: d,
          start_time: startTime * 1000,
          end_time: endTime * 1000,
          aggregate_window: this.params.aggregate_window,
          aggregate_function: this.params.aggregate_function
      }

      if (this.$route.path === "/kanban/share") {
        params.shareId = this.$route.query?.id;
      }
      this.loadingState = LoadingState.LOADING;
      let { data: result } = await statisticBatch(params);
      const series = getSeries(result.data, this.optionData.series);
      this.changeData(series);
      this.loadingState = LoadingState.FINISHED;
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
      setTimeout(() => {
        this.loadingState = LoadingState.FINISHED;
        this.getHistory(this.optionData.mapping)
      }, 50)
    },
    /**
     * 聚合间隔
     * @param command
     */
     handleAggregateWindowCommand(command) {
      this.params.aggregate_window = command;
      this.getHistory(this.optionData.mapping)
    },
    /**
     * 聚合方法
     * @param command
     */ 
    handleAggregateFuncCommand(command) {
      this.params.aggregate_function = command;
      this.getHistory(this.optionData.mapping);
    },
    /**
     * 手动刷新
     */
    handleRefresh() {
      this.getHistory(this.optionData.mapping);
    },
    /**
     * @description: 更新图表状态
     * @param {*} deviceStatus
     * @return {*}
     */    
    updateStatus(deviceStatus) {
      this.deviceStatus = deviceStatus;
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
      this.myEcharts && this.myEcharts.setOption && this.myEcharts.setOption(option)
      this.myEcharts && this.myEcharts.resize && this.myEcharts.resize();
    },
    getChartStyle() {
      let style = this.optionData.style ? this.optionData.style : {};
      let backgroundColor = style.backgroundColor ? style.backgroundColor : "#2d3d86";
      return {
        backgroundColor
      }
    },
    handleClick() {
      if (this.$slots.default && this.$slots.default.length) {
        this.$emit("update:select", !this.select)
      }
    },
    showConfiguration() {
      this.$emit("config", this.option)
    }

  }
}
</script>

<style scoped lang="scss">
.echarts-loading {
  background-color: transparent !important;
}
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
  justify-content: space-between;

  width: 100%;
  height: 40px;
  padding-left: 10px;
  // text-align: right;
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
  font-weight: 800 !important;
  background-color: #ecf5ff;
  // color: #66b1ff;
}
</style>