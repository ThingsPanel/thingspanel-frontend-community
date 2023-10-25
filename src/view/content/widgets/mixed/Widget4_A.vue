<!-- CPU/内存占用曲线 -->
<template>
  <div class="row">
    <div class="col-md-6">
      <div class="panel-bg-blue px-6 py-4 rounded">
        <div class="text-muted">{{ $t("HOME.TITLE21") }}</div>
        <div class="chart_height text-white title-num">
          <!-- cpu占用曲线-->
          <curve-chart :value="cpuCurveData" key="cpu" :title="cpuTitle"></curve-chart>

        </div>
      </div>
    </div>
    <div class="col-md-6">
      <div class="panel-bg-blue px-6 py-4 rounded">
        <div class="text-muted">{{ $t("HOME.TITLE22") }}</div>
        <div class="chart_height text-white title-num">
          <!-- 内存占用曲线-->
          <curve-chart :value="ramCurveData" key="ram" :title="ramTitle"></curve-chart>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.panel-bg-blue {
  background: #2d3d88;
}

.title-num {
  font-size: 18px;
}

.chart_height {
  height: 320px;
}

.chart_equheight {
  height: 320px;
}

@media only screen and (min-width: 1440px) and (max-width: 1600px) {
  .chart_height {
    height: 250px;
  }

  .chart_equheight {
    height: 250px;
  }
}

@media only screen and (min-width: 1681px) and (max-width: 1920px) {
  .chart_height {
    height: 350px;
  }

  .chart_equheight {
    height: 350px;
  }
}

@media only screen and (min-width: 1920px) {
  .chart_height {
    height: 400px;
  }

  .chart_equheight {
    height: 400px;
  }
}

@media only screen and (max-width: 1680px) {
  .chart_height {
    height: 350px;
  }

  .chart_equheight {
    height: 350px;
  }
}

@media only screen and (max-width: 1366px) {
  .chart_height {
    height: 160px;
  }

  .chart_equheight {
    height: 160px;
  }
}
</style>
<script>
import ApiService from "@/core/services/api.service";
import AUTH from "@/core/services/store/auth.module";
import {REFRESH} from "@/core/services/store/auth.module";
import i18nService from "@/core/services/i18n.service.js";
import CurveChart from "@/components/e-charts/CurveChart";
import {local_url} from "../../../../api/LocalUrl";
export default {
  name: "widget-4",
  components: {CurveChart},
  data() {
    return {
      cpuTitle: i18nService.getActiveLanguage() == 'en' ? 'CPU footprint' : 'CPU占用',
      ramTitle: i18nService.getActiveLanguage() == 'en' ? 'RAM footprint' : 'RAM占用',
      cpuCurveData: {},
      ramCurveData: {},
      timer: null
    }
  },
  created() {
    this.ajaxdata();
    this.timer = setInterval(this.ajaxdata, 10000);
  },
  mounted() {
  },
  beforeDestroy() {
    clearInterval(this.timer);
  },
  methods: {
    ajaxdata() {
      ApiService.post(local_url + (local_url.endsWith("/") ? "api" : "/api")  + "/home/chart")
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
