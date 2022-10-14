<template>
  <div class="component-chart">
    <div class="component-item" v-for="(chart, index) in dataList" :key="index">
      <dashboard-chart v-show="chart.controlType == 'dashboard'" style="width: 200px;height: 200px" :option="chart"></dashboard-chart>
    </div>
  </div>
</template>

<script>
import DashboardChart from "@/components/e-charts/DashboardChart";
export default {
  name: "index",
  components: {
    DashboardChart
  },
  props: {
    dataList: {
      type: [Array],
      default: () => []
    }
  },
  data() {
    return {
      chartList: []
    }
  },
  mounted() {
    console.log("====chart", this.dataList)
  },
  methods: {

  }
}
</script>

<style scoped>

</style>