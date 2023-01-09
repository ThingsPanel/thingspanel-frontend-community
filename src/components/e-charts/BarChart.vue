<template>
  <div style="width: 100%;height: 100%" :id="'main' + option.cptId" ref="chart-main"></div>
</template>

<script>
import "@/core/mixins/charts.js"

export default {
  name: "BarChart",
  props: {
    option: {
      type: [Object],
      default: () => {return {}}
    },
  },
  watch: {

  },
  data() {
    return {
      defaultOption: {
        xAxis: {
          type: 'category',
          data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          axisLabel: {
            fontSize: 16,
            color: '#fff'
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            fontSize: 16,
            color: '#fff'
          }
        },
        series: [
          {
            data: [120, 200, 150, 80, 70, 110, 130],
            type: 'bar'
          }
        ]
      }
    }
  },
  mounted() {
    this.echartsInit();
    window.addEventListener("resize",() => {
      this.myChart.resize();
    });

  },
  methods: {
    /**
     * 初始化echarts
     */
    echartsInit() {
      this.myChart = this.$echarts.init(this.$refs["chart-main"]);
      this.myChart.setOption(this.defaultOption);
      this.$nextTick(() => {
        this.myChart.resize();
      })
    },
  }
}
</script>

<style scoped>

</style>