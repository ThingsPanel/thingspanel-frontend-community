<template>
  <div style="width: 100%;height: 100%" :id="'main' + option.cptId" ref="chart-main"></div>
</template>

<script>
import "@/core/mixins/charts.js"

export default {
  name: "PieChart",
  props: {
    option: {
      type: [Object],
      default: () => {
        return {}
      }
    },

  },
  watch: {},
  data() {
    return {
      defaultOption:
          {
            legend: {
              orient: "vertical",
              left: "left",
              textStyle: {color: '#fff'}
            },
            series:
                [
                  {
                    type: "pie",
                    label: {color: "#fff"},
                    data: [
                      {value: 335, name: "Apple"},
                      {value: 135, name: "Oranges"},
                      {value: 1548, name: "Bananas"}
                    ]
                  }
                ]
          }
    }
  },
  mounted() {
    this.echartsInit();
    window.addEventListener("resize", () => {
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
    setEChartsValue() {

    }
  }
}
</script>

<style scoped>

</style>