<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-01-29 14:11:23
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-28 15:37:46
 * @FilePath: \ThingsPanel-Backend-Vue\packages\device_plugin\charts\components\dashboard\EChart.vue
 * @Description: 
-->
<template>
    <div style="width:100%;height:100%;" ref="chart-main" @click="handleClick"/>
</template>

<script>
import * as echarts from 'echarts';
export default {
  name: "ChartIndex",
  props: {
    option: {
      type: [Object],
      default: () => { return {} }
    },
    dataSrc: {
      type: [Array],
      default: () => []
    }
  },
  data() {
    return {
      myChart: null,
    }
  },
  mounted() {
    this.initEcharts();
    // 自适应大小
    window.addEventListener("resize",() => {
      this.myChart.resize();
    });
  },
  methods: {
    /**
     * 初始化图表
     */
    initEcharts() {
      this.myChart = echarts.init(this.$refs["chart-main"]);
      this.$nextTick(() => {
        this.myChart.resize();
      });
      // 使用指定的配置项和数据显示图表。
      this.myChart.setOption(this.option);
      let data = this.option.series[0].data;
      let title = data[0].name ? data[0].name : "";
      // if (this.option.simulator) {
      //   let sim = this.option.simulator;
      //   setInterval(() => {
      //     let series = [];
      //     for (let i = 0; i < sim.funcArr.length; i++) {
      //       let fn = new Function(sim.funcArr[i])
      //       let value = fn();
      //       let data = { data: [{ value, name: title }]};
      //       series.push(data);
      //     }
      //     this.myChart.setOption({series})
      //   }, sim.interval)
      // }

    },
    /**
     * 点击图表新增图表映射
     */
    handleClick() {
      this.$emit("clickChart", this.option)
    },
  }
}

</script>

<style scoped>
.el-card {
  text-align: center;
}
::v-deep .el-card__body {
  padding: 10px;
  text-align: center;
}

</style>