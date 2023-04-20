<template>
  <div>
    <el-card>
      <!-- cpu占用曲线-->
      <curve-chart :value="cpuCurveData" key="cpu" :title="cpuTitle"></curve-chart>
    </el-card>
    <el-card>
      <!-- 内存占用曲线-->
      <curve-chart :value="ramCurveData" key="ram" :title="ramTitle"></curve-chart>
    </el-card>
  </div>
</template>

<script>
import ApiService from "@/core/services/api.service";
import AUTH from "@/core/services/store/auth.module";
import {REFRESH} from "@/core/services/store/auth.module";
import i18nService from "@/core/services/i18n.service.js";
import CurveChart from "@/components/e-charts/CurveChart";
import {local_url} from "../../../../api/LocalUrl";
export default {
  name: "CurveWidget",
  components: {CurveChart},
  data() {
    return {
      cpuTitle: i18nService.getActiveLanguage() == 'en' ? 'CPU footprint' : 'CPU占用',
      ramTitle: i18nService.getActiveLanguage() == 'en' ? 'RAM footprint' : 'RAM占用',
      cpuCurveData: {},
      ramCurveData: {},
    }
  },
  created() {
    this.ajaxdata();
    setInterval(this.ajaxdata, 60000);
  },
  mounted() {
  },
  methods: {
    ajaxdata() {
      ApiService.post(local_url + "api/home/chart")
          .then(({data}) => {
            if (data.code == 200) {
              let cpu_xAxis = [], cpu_series = [];
              cpu_xAxis = data.data.cpu.map(item => item.created_at);
              cpu_series = data.data.cpu.map(item => item.cpu);

              let cpu = {
                xAxis:[{data: cpu_xAxis}],
                series: [{data: cpu_series}]
              };
              this.cpuCurveData = cpu;

              let ram_xAxis = [], ram_series = [];
              ram_xAxis = data.data.mem.map(item => item.created_at);
              ram_series = data.data.mem.map(item => item.mem);
              let ram = {
                xAxis:[{data: ram_xAxis}],
                series: [{data: ram_series}]
              };
              this.ramCurveData = ram;

            } else if (data.code == 401) {
              this.$store
                  .dispatch(REFRESH)
                  .then(() => {
                  });
            } else {

            }
          });
    },
  }
};
</script>

<style scoped>

</style>