<template>
  <div class="chart-div">
    <div class="chart-header">

      <span class="title">{{ optionData.name }}</span>
      <div class="tool-right">
        <!-- 刷新频率  -->
        <el-dropdown @command="handleFlushCommand">
          <el-button class="tool-item" size="mini" icon="el-icon-time"></el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="2">2秒</el-dropdown-item>
            <el-dropdown-item command="5">5秒</el-dropdown-item>
            <el-dropdown-item command="10">10秒</el-dropdown-item>
            <el-dropdown-item command="30">30秒</el-dropdown-item>
            <el-dropdown-item command="60">1分钟</el-dropdown-item>
            <el-dropdown-item command="custom">自定义</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <el-button v-if="optionData.controlType == 'history'" class="tool-item" size="mini" icon="el-icon-picture-outline"></el-button>

        <el-button class="tool-item" size="mini" icon="el-icon-more" @click="showConfiguration"></el-button>
      </div>

    </div>

    <div style="width: 100%; height:100%" ref="chart"></div>

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
import { currentValue, historyValue } from "@/api/device";
import { addTimer, clearTimer } from "@/utils/tool.js"

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
      controlType: "dashboard",
      optionData: {},
      configurationVisible: false,
      flushTime: 5,
      timer: null
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
    this.controlType = this.optionData.controlType;
    this.initEChart();
    this.updateOption()
  },
  beforeDestroy() {
    clearTimer();
  },
  methods: {
    /**
     * 加载EChats图表
     */
    initEChart(option) {
      this.myEcharts = Echarts.init(this.$refs.chart, 'dark');
      this.$nextTick(() => {
        this.myEcharts.resize();
      });
      this.optionData.backgroundColor = 'transparent';
      if (option) {
        this.myEcharts.setOption(option);
      } else {
        this.myEcharts.setOption(this.optionData);
      }
      console.log("initEChart.updateOption()")
    },
    // 更新图表的值
    updateOption() {
      if (this.timer) {
        clearInterval(this.timer);
      }
      console.log("updateOption.timer", this.timer)
      this.getValue();
      this.timer = setInterval(() => {
        this.getValue();
      }, this.flushTime * 1000);
      addTimer(this.timer);
    },
    getValue() {
      // 轮询获取指定设备的推送数据
      if (this.controlType == "history") {
        // 历史数据
        this.getHistory(this.device.device, this.optionData.mapping);
      } else {
        // 当前值
        this.getCurrent(this.device.device, this.optionData.mapping);
      }
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
              let title = this.optionData.series[0].data[0].name ? this.optionData.series[0].data[0].name : "";
              if (!this.optionData || !this.optionData.mapping) return;
                this.optionData.mapping.forEach(map => {
                  let serie = { data: [{ value: data.data[0][map], name: title }]};
                  series.push(serie);
                })
                // 设置图表的当前值
                this.myEcharts.setOption({series})
            }
          }
        })
    },
    getHistory(deviceId, attrs) {
      if (!attrs || attrs.length == 0) return;
      let timestamp = (new Date()).getTime();
      let yesterday = timestamp-246060*1000;
      let rate = 10 * 1000 * 1000;  // 微秒
      let attribute = attrs.concat(["systime"])
      historyValue(
          {
            device_id: deviceId,
            attribute,
            "start_ts": yesterday,
            "end_ts": timestamp,
            rate
          }
      )
        .then(({data}) => {
          if (data.code == 200) {
            let series = [];
            for (let i = 0; i < attrs.length; i++) {
              series.push({ data: data.data[attrs[i]], type: "line"})
            }
            let sysTimes = data.data.systime.map(item => item = item.substring(12))
            let xAxis = {data: sysTimes, type: 'category'} ;
            let option = { series, xAxis };
            this.initEChart(option);
          }
        })
    },
    handleFlushCommand(command) {
      console.log()
      if (command != "custom") {
        this.flushTime = command;
        this.updateOption();
      }
    },
    showConfiguration() {
      // this.configurationVisible = true;
    },
    /**
     * 修改 e-chart 大小
     */
    sizeChange(){
      this.myEcharts.resize();
    }
  },
}


</script>

<style scoped lang="scss">
.chart-div {
  margin: 10px 20px 10px 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  background-color: #2d3d86;
  border-radius: 16px;
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