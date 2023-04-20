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
    value: {
      type: [Array],
      default: () => []
    }
  },
  watch: {
    value: {
      handler(newValue) {
        console.log("====PieChart.value", newValue)
        this.setEChartsValue(newValue);
      }
    },
  },
  data() {
    return {
      defaultOption: {
            legend: {
              orient: "vertical",
              left: "left",
              textStyle: {color: '#fff'}
            },
            series: [
              {
                type: "pie",
                label: {
                  color: "#fff",
                  fontSize: 20
                },
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
    setEChartsValue(valueList) {
      if (!this.option || !this.option.dataSrc || !valueList) return;
      let data = [];
      let dataSrc = this.option.dataSrc;
      dataSrc.forEach(item => {
        let deviceId = item.deviceId;
        let { title, name } = item.property;
        let index = valueList.findIndex(val => val.deviceId == deviceId);
        let value = valueList[index].value ? valueList[index].value[name] : 0;
        data.push({ name: title, value })
      });
      console.log("====PieChart", data)

      let series = [{label: { formatter: '{b}: {@2012} ({d}%)' }, data }]
      this.myChart.setOption({ series });
    }
  }
}
</script>

<style scoped>

</style>