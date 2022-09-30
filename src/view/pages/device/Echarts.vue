<template>
  <div class="chart-div">
    <div class="chart-header">
<!--      <el-dropdown>-->
<!--        <i class="el-icon-arrow-down el-icon&#45;&#45;right"></i>-->
<!--        -->
<!--        <el-dropdown-menu slot="dropdown">-->
<!--          <el-dropdown-item>黄金糕</el-dropdown-item>-->
<!--          <el-dropdown-item>狮子头</el-dropdown-item>-->
<!--          <el-dropdown-item>螺蛳粉</el-dropdown-item>-->
<!--          <el-dropdown-item disabled>双皮奶</el-dropdown-item>-->
<!--          <el-dropdown-item divided>蚵仔煎</el-dropdown-item>-->
<!--        </el-dropdown-menu>-->
<!--      </el-dropdown>-->
      <span class="title">{{ optionData.name }}</span>
        <el-button class="tool-item" size="mini" icon="el-icon-more"></el-button>

    </div>
    <div style="width: 360px; height: 360px" ref="chart"></div>
  </div>
</template>

<script>
import {currentValue} from "@/api/device";
let Echarts = require('echarts/lib/echarts');
require('echarts/lib/chart/gauge');

export default {
  name: "Echarts",
  props: {
    option: {
      type: [Object],
      default: () => {return {}}
    },
    value: {
      type: [Object],
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
      optionData: {}
    }
  },
  watch: {
    value: {
      handler(newValue) {
        if (newValue) {
          this.refreshOption(newValue);
        }
      }
    }
  },
  mounted() {
    this.optionData = JSON.parse(JSON.stringify(this.option));
    this.initEChart();
    console.log("====mounted", this.optionData)
  },
  beforeDestroy() {
    clearTimer();
  },
  methods: {
    /**
     * 加载EChats图表
     */
    initEChart() {
      this.myEcharts = Echarts.init(this.$refs.chart, '');
      this.$nextTick(() => {
        this.myEcharts.resize();
      });
      this.myEcharts.setOption(this.optionData);
      this.updateOption(this.optionData)
    },
    // 更新图表的值
    updateOption() {
      let timer = setInterval(() => {
        // 轮询获取指定设备的推送数据
        this.getCurrent(this.device.device, this.optionData.mapping);
      }, 1000);
      addTimer(timer);
    },
    /**
     * 从服务器获取指定设备的推送数据
     * @param deviceId
     * @param attrs
     */
    getCurrent(deviceId, attrs) {
      currentValue({entity_id: deviceId, attribute: attrs})
        .then(({data}) => {
          if (data.code == 200) {
            if (data.data) {
              let series = [];
              this.optionData.mapping.forEach(map => {
                let serie = { data: [{ value: data.data[0][map] }]};
                series.push(serie);
              })
              // 设置图表的当前值
              this.myEcharts.setOption({series})
            }
          }
        })
    }
  }
}
const addTimer = (timer) => {
  var timers = JSON.parse(localStorage.getItem("timers"));
  if (!timers) {
    timers = [];
  }
  timers.push(timer);
  localStorage.setItem("timers", JSON.stringify(timers))
}
const clearTimer = () => {
  var timers = JSON.parse(localStorage.getItem("timers"));
  if (timers && timers.length > 0)
    timers.forEach(timer => clearInterval(timer))
  localStorage.setItem("timers", null);
}

</script>

<style scoped lang="scss">
.chart-div {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1)
}
.chart-header {
  position: relative;
  display: flex;
  width: 100%;
  height: 40px;
  padding-left: 10px;
  text-align: right;
  box-shadow: 0 2px 0px 0 rgba(0, 0, 0, 0.1);
  .title {
    width: 100%;
    flex-grow: 1;
    color: #cccccc;
    text-align: center;
    margin-top: 10px;
    margin-bottom: 10px;
    font-size: 18px;
  }
  .tool-item {
    position: absolute;
    text-align: center;
    background: transparent!important;
    border: 0px solid transparent;
    top:4px;
    right: 4px;
  }
}
</style>