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
    value: {
      type: [Object, Array],
      default: () => []
    }
  },
  watch: {
    value: {
      handler(newValue) {
        this.setEChartsValue(newValue);
      }
    }
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
            label: {
              show: true,
              position: 'inside'
            },
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
      let data = this.option.dataSrc.map(item => item.property.title);
      // x轴标签
      this.defaultOption.xAxis.data = data;
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
        data.push({ value })
      });

      let series = [{ data }]
      this.myChart.setOption({ series });
    }
  }
}
</script>

<style scoped>

</style>