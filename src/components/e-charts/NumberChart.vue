<template>
  <div style="width: 100%;height: 100%" id="main" ref="chart-main"></div>
</template>

<script>
export default {
  name: "NumberChart",
  props: {
    option: {
      type: [Object],
      default: () => { return numberOption }
    },
    color: {
      type: [String],
      default: "#f7b033"
    },
    value: {
      type: [Number, String],
      default: 1
    },
    autoResize: {
      type: [Boolean, String],
      default: true
    }
  },
  watch: {
    value: {
      handler(newValue) {
        this.setEchartsValue(newValue);
      }
    }
  },
  data() {
    return {
      myChart: null,
      optionData: {}
    }
  },
  mounted() {
    // 在通过mounted调用即可
    this.echartsInit();
    if (this.autoResize) {
      window.addEventListener("resize",() => {
        this.myChart.resize();
      });
    }
  },
  methods: {
    //初始化echarts
    echartsInit() {
      this.myChart = this.$echarts.init(this.$refs["chart-main"]);
      this.$nextTick(() => {
        this.myChart.resize();
      });
      this.optionData = JSON.parse(JSON.stringify(this.option));
      this.optionData.series[0].itemStyle.color = this.color;
      this.optionData.series[0].data[0].value = this.value;
      this.myChart.setOption(this.optionData);
    },
    setEchartsValue(value) {
      if (!this.myChart) return;
      let option = { series: [ { data: [ { value }]}]}
      this.myChart.setOption(option);
    }
  }
}
const numberOption = {
  title: {
    text: ''
  },
  legend: {
    data: []
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  grid: {
    containLabel: true,
    left: 0,
    bottom:'10px',
  },
  yAxis: {
    data: [],
    inverse: true,
    axisLine: {show: false},
    axisTick: {show: false},
    axisLabel: {
      margin: 0,
      fontSize: 14,
    },
    axisPointer: {
      label: {
        show: true,
        margin: 0
      }
    }
  },
  xAxis: {
    splitLine: { show: false },
    axisLabel: { show: false },
    axisTick: { show: false },
    axisLine: { show: false }
  },
  series: [
    {
      itemStyle: {
        color: '#F85778'
      },
      name: '设备',
      type: 'pictorialBar',
      label: {
        normal: {
          show: true,
          position: 'left,top',
          offset: [0, -30],
          textStyle: {
            fontSize: 20
          },
          color:'#fff'
        }
      },
      symbol: 'media/bg/chart-img.png',
      symbolRepeat: true,
      symbolSize: ['15%', '100%'],
      barCategoryGap: '0%',
      data: [
        {
          value: 1,
          barMinHeight:'60%'
        }
      ]
    }
  ]
};
</script>

<style scoped>

</style>