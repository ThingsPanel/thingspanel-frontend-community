<!-- 曲线图表 -->
<template>
  <div style="width: 100%;height: 100%" id="main" ref="chart-main"></div>
</template>

<script>
import i18nService from "@/core/services/i18n.service.js";
export default {
  name: "CurveChart",
  props: {
    option: {
      type: [Object],
      default: () => { return curveOption }
    },
    title: {
      type: [String],
      default: ""
    },
    value: {
      type: [Object],
      default: () => { return {} }
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
      },
      immediate: true,
      deep: true
    }
  },
  mounted() {
    // 初始化
    this.echartsInit()
    // 自适应大小
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
      this.optionData = JSON.parse(JSON.stringify(this.option));
      this.optionData.series[0].name = this.title;
      this.myChart.setOption(this.optionData);
    },
    setEchartsValue(value) {
      if (!this.myChart) {
        this.echartsInit();
      }
      this.myChart.setOption(value);
    }
  }
}
const curveOption = {
  title: {
    show: false,
    text: "",
    textStyle: {
      align: 'center',
      verticalAlign: 'middle',
    },
    top: 10,
    left: '10',
  },
  legend: {
    show: true,
    top: 10,
    textStyle:{
      color:'#fff'
    }
    // data: [],
  },
  tooltip : {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      label: {
        backgroundColor: '#6a7985'
      }
    }
  },
  grid: {
    top: '15%',
    right: '2%',
    left: '5%',
    bottom: '10%'
  },
  xAxis: [
    {
      type: 'category',
      boundaryGap: false,
      axisLabel: {
        color: '#88adf6'
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#0f2486'
        }
      },
      axisTick: {
        show: true,
      },
      splitLine: {
        show: false,
        lineStyle: {
          color: '#0f2486'
        }
      },
      data: ['8:00','9:00','10:00','11:00','12:00','13:00','14:00']
    }
  ],
  yAxis: [
    {
      type: 'value',
      name: '%',
      nameTextStyle: {
        color: '#88adf6'
      },
      /*min: -40,
      max: 45,*/
      axisLabel: {
        formatter: '{value}',
        textStyle: {
          color: '#88adf6'
        }
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#0f2486'
        }
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        show: false,
      }
    }
  ],
  series: [
    {
      name: i18nService.getActiveLanguage() == 'en' ? 'CPU footprint' : 'CPU占用',
      type: 'line',
      smooth: true,
      stack: '',
      symbol: 'emptyCircle',
      symbolSize: 6,
      itemStyle: {
        normal: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [{
              offset: 0, color: '#f7b033', // 0%
            }, {
              offset: 1, color: '#f85778', // 100%
            }],
          },
          lineStyle: {
            width: 2
          },
          /*areaStyle: {
              normal: {
                  opacity: 0.2,
              },
          },*/
        }
      },
      markPoint: {
        itemStyle: {
          normal: {
            color: '#fff'
          }
        }
      },
      data: [10,23,10,40,29,35,23],
    }
  ],
  animationDuration: 1000,
}
</script>

<style scoped>

</style>