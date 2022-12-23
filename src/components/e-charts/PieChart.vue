<template>
  <div style="width: 100%;height: 100%" :id="'main' + option.cptId" ref="chart-main"></div>
</template>

<script>
export default {
  name: "PieChart",
  props: {
    option: {
      type: [Object],
      default: () => {return {}}
    }
  },
  data() {
    return {
      defaultOption: {
        title: {
          text: 'Referer of a Website',
          subtext: 'Fake Data',
          left: 'center'
        },
        tooltip: {
          trigger: 'item'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [
          {
            name: 'Access From',
            type: 'pie',
            radius: '50%',
            data: [
              { value: 1048, name: 'Search Engine' },
              { value: 735, name: 'Direct' },
              { value: 580, name: 'Email' },
              { value: 484, name: 'Union Ads' },
              { value: 300, name: 'Video Ads' }
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
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