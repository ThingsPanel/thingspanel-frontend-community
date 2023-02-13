<template>
    <div style="width: 100%;height: 100%;background-color: transparent" :id="'main' + option.cptId" ref="chart-main"></div>
</template>

<script>
import "@/core/mixins/charts.js"

export default {
  name: "DashboardChart",
  props: {
    option: {
      type: [Object],
      default: () => { return {} }
    },
    color: {
      type: [String],
      default: "#3aa423"
    },
    min: {
      type: [Number, String],
      default: 0
    },
    max: {
      type: [Number, String],
      default: 100
    },
    value: {
      type: [Number, String, Array, Object],
      default: "0"
    },
    unit: {
      type: [String],
      default: ""
    },
    title: {
      type: [String],
      default: ""
    },
    autoResize: {
      type: [Boolean, String],
      default: true
    }
  },
  watch: {
    value: {
      handler(newValue) {
        console.log("====DashboardChart.value", typeof newValue, newValue)
        this.setEChartsValue(newValue);
      },
      immediate: true
    },
  },
  data() {
    return {
      // myChart: null,
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

    const chartMain = document.getElementById("main" + this.option.cptId);
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        switch(entry.target) {
          case chartMain: {
            let length = Math.min(entry.contentRect.width, entry.contentRect.height)
            let option = this.resizeECharts(JSON.parse(JSON.stringify(this.optionData)), length);
            this.myChart.setOption(JSON.parse(JSON.stringify(option)))
          }
        }
      }
    })
    resizeObserver.observe(chartMain);

  },
  methods: {
    //初始化echarts
    echartsInit() {
      this.myChart = this.$echarts.init(this.$refs["chart-main"], null, { renderer : 'svg' });
      this.optionData = this.initOption(this.option);
      this.optionData.series[0].min = this.min;
      this.optionData.series[0].max = this.max;
      this.optionData.series[0].data[0].name = this.title;
      this.optionData.series[0].data[0].value = this.value;
      this.optionData.series[0].detail.formatter = "{value} " + this.unit;
      // 进度条颜色
      this.optionData.series[0].progress.itemStyle.color = this.color;
      // 指针颜色
      this.optionData.series[0].pointer.itemStyle.color = this.color;
      console.log("====初始化echarts", this.optionData);
      this.myChart.setOption(this.optionData);
      this.$nextTick(() => {
        this.myChart.resize();
      });
    },
    /**
     * 设置Echarts图表的值
     * @param value
     */
    setEChartsValue(value) {
      console.log("====设置Echarts图表的值", value)
      let option = null;
      if (typeof value == "string" || typeof value == "number") {
        option = { series: [ { data: [ { value }]}]};
      } else if (typeof value == "object"){
        if (Object.prototype.toString.call(value) === "[object Array]") {
          // object

          if (this.option.dataSrc) {
            let property = this.option.dataSrc[0].property;

            let val = value[0]['value'][property.name];
            if (val) {
              option = { series: [ { data: [ { value: val }], detail: { formatter: '{value}' + property.unit } }]};
            }
          }
        } else {
          // array
          let series = value.map(item => { return { data: [ { value: item } ] } })
          option = { series };
        }
      }
      console.log("====我是Object", option)

      this.myChart.setOption(option);
    },
    initOption(opt) {
      let option = JSON.parse(JSON.stringify(opt));
      if (!option.series) option.series = JSON.parse(JSON.stringify(dashboardOption.series));

      if (!option.series[0].data) console.log(option.series[0])

      if (option.series[0].data && (typeof option.series[0].data[0]) == "number") {
        option.series[0].data[0] = { value: option.series[0].data[0], name: ""}
      }
      if (!option.series[0].detail) option.series[0].detail = {};

      if (!option.series[0].progress) option.series[0].progress = {};
      if (!option.series[0].progress.itemStyle) option.series[0].progress.itemStyle = {};

      if (!option.series[0].pointer) option.series[0].pointer = {};
      if (!option.series[0].pointer.itemStyle) option.series[0].pointer.itemStyle = {};
      option.backgroundColor = "transparent"
      console.log("====initOption", option)
      return option;
    }
  }
}

const dashboardOption = {
  title: {
    text: "",
    x: 'center',
    y: '48%',
    textStyle: { // 其余属性默认使用全局文本样式，详见TEXTSTYLE
      color: '#0493fa',
      fontWeight: 'bolder',
      "fontSize": 13
    },
  },
  tooltip: {
    formatter: "{a} <br/>{b} : {c}"
  },
  toolbox: {
    show: false,
    feature: {
      mark: {
        show: true
      },
      restore: {
        show: true
      },
      saveAsImage: {
        show: true
      }
    }
  },
  series: [{
    center: ['50%', '60%'],
    startAngle: 210, //仪表盘起始角度
    endAngle: -30, //仪表盘结束角度
    splitNumber: 10, //分割段数
    name: "",
    type: 'gauge',
    radius: '100%',
    axisLine: { // 坐标轴线
      lineStyle: { // 属性lineStyle控制线条样式
        color: [
          [0.25, '#ddd'],
          [1, '#ddd']
        ],
        width: 8
      }
    },
    axisTick: { // 坐标轴小标记
      show:false,
      splitNumber: 10, // 每份split细分多少段
      length: 10, // 属性length控制线长
      lineStyle: { // 属性lineStyle控制线条样式
        color: '#ddd'
      }
    },
    axisLabel: { // 坐标轴文本标签，详见axis.axisLabel
      show:true,
      distance: -6,
      textStyle: { // 其余属性默认使用全局文本样式，详见TEXTSTYLE
        color: '#88adf6',
        fontSize: 12,
      }
    },
    splitLine: { // 分隔线
      show: false, // 默认显示，属性show控制显示与否
      length: 10, // 属性length控制线长
      lineStyle: { // 属性lineStyle（详见lineStyle）控制线条样式
        color: 'auto'
      }
    },
    progress: {
      show: true,
      width: 8,
      itemStyle: {
        color: '#3aa423'
      }
    },
    pointer: { // 指针
      show:true,
      width: 3,
      itemStyle: {
        color: '#3aa423'
      }
    },
    title: {
      textStyle: { // 其余属性默认使用全局文本样式，详见TEXTSTYLE
        fontWeight: 'bolder',
        color: "#9b9b9b",
        fontSize: 14,
      },
      "show": true,
      "offsetCenter": [0, "-110%"],
      "padding": [5, 5],
      "fontSize": 14,
    },
    detail: {
      formatter: '{value}',
      textStyle: { // 其余属性默认使用全局文本样式，详见TEXTSTYLE
        color: '#fff',
        // fontWeight: 'bolder',
        "fontSize": 18
      },
      "offsetCenter": [0, "50%"],
    },

    data: [{
      value: 10,
      name: ""
    }]
  }]
};
</script>

<style scoped>

</style>