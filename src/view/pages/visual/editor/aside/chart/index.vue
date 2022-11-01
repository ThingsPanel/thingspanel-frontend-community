<template>
  <div class="component-chart">
    <div class="component-item" v-for="(chart, index) in dataList" :key="index">
      <dashboard-chart style="width: 200px;height: 200px;position: absolute"
                       v-if="chart.controlType == 'dashboard' && chart.type != 'status'"  :option="chart"></dashboard-chart>
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