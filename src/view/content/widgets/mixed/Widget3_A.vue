<!--
  设备总数
  消息总数
  CPU占用率
  内存占用率
-->
<template>
    <div class="row">
        <div class="col-md-3">
            <div class="panel-bg-blue px-6 py-4 rounded">
                <div class="text-muted">{{ $t("HOME.DEVICE_TOTAL") }}</div>
                <div class="chart_height text-white title-num">
                    <!-- 设备总数 -->
                    <div style="height: 80px;line-height: 80px;font-size: 20px" v-if="deviceTotal == 0">0</div>
                    <number-chart v-else :value="deviceTotal"></number-chart>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="panel-bg-blue px-6 py-4 rounded">
                <div class="text-muted">{{ $t("HOME.MESSAGE_TOTAL") }}</div>
                <div class="chart_height text-white title-num">
                    <!-- 消息总数 -->
                    <div style="height: 80px;line-height: 80px;font-size: 20px" v-if="messageTotal == 0">0</div>
                    <number-chart v-else color="#F85778" :value="messageTotal"></number-chart>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="panel-bg-blue px-6 py-4 rounded">
                <div class="text-muted">{{ $t("HOME.TITLE19") }}</div>
                <div class="chart_height">
                    <dashboard-chart :value="cpuUsage" unit="%"></dashboard-chart>
                    <!-- CPU占用率 -->
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="panel-bg-blue px-6 py-4 rounded">
                <div class="text-muted">{{ $t("HOME.TITLE20") }}</div>
                <div class="chart_height">
                    <!-- 内存占用率 -->
                    <dashboard-chart color="#0493fa" :value="ramUsage" unit="%"></dashboard-chart>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped>
/*.panel-bg-blue{background: #2d3d88;}*/
.title-num {
    font-size: 18px;
}

.chart_height {
    height: 130px;
}

.home_chart {
    width: 150px;
    height: 150px;
    margin: 0 auto;
    position: relative;
    bottom: 18px;
}

.chart_equheight {
    height: 110px;
    border-bottom: 1px solid rgba(91, 146, 255, 0.15);
    position: relative;
    bottom: 0px;
}

@media only screen and (min-width:1000px) and (max-width: 1200px) {
    .chart_height {
        height: 130px;
    }

    .home_chart {
        width: 150px;
        height: 150px;
    }

    .chart_equheight {
        height: 110px;
    }
}

@media only screen and (min-width:1280px) and (max-width: 1366px) {
    .chart_height {
        height: 130px;
    }

    .home_chart {
        width: 150px;
        height: 150px;
    }

    .chart_equheight {
        height: 110px;
    }
}

@media only screen and (min-width:1681px) and (max-width:1920px) {
    .chart_height {
        height: 130px;
    }

    .home_chart {
        width: 150px;
        height: 150px;
    }

    .chart_equheight {
        height: 110px;
    }
}

@media only screen and (min-width:1921px) {
    .chart_height {
        height: 180px;
    }

    .home_chart {
        width: 200px;
        height: 200px;
    }

    .chart_equheight {
        height: 150px;
    }
}

@media only screen and (max-width:1680px) {
    .chart_height {
        height: 180px;
    }

    .home_chart {
        width: 200px;
        height: 200px;
    }

    .chart_equheight {
        height: 150px;
    }
}

@media only screen and (max-width: 1366px) {
    .chart_height {
        height: 100px;
    }

    .home_chart {
        width: 120px;
        height: 120px;
    }

    .chart_equheight {
        height: 90px;
    }
}</style>
<script>
import ApiService from "@/core/services/api.service";
import { local_url } from "@/api/LocalUrl"
import { REFRESH } from "@/core/services/store/auth.module";
import NumberChart from "@/components/e-charts/NumberChart";
import DashboardChart from "@/components/e-charts/DashboardChart";
export default {
    name: "widget-2",
    components: { DashboardChart, NumberChart },
    data() {
        return {
            business: '', // 业务
            assets: '', // 资产
            equipment: '', // 设备
            conditions: '',
            dashboard: '',
            deviceTotal: "0",
            messageTotal: "0",
            cpuUsage: 0,
            ramUsage: 0,
            timer: null
        }
    },
    created() {
        this.ajaxdata();
        this.timer = setInterval(this.ajaxdata, 10000);
    },
    beforeDestroy() {
        clearInterval(this.timer);
    },

    methods: {
        ajaxdata() {
            console.log("====document.location.origin", document.location.origin);
            ApiService.post(local_url + (local_url.endsWith("/") ? "api" : "/api") + "/home/list")
                .then(({ data }) => {
                    if (data.code == 200) {
                        this.deviceTotal = data.data.device ? data.data.device : 0;
                        this.messageTotal = data.data.msg ? data.data.msg : 0;
                        this.cpuUsage = data.data['cpu_usage'] ? data.data['cpu_usage'] : 0;
                        this.ramUsage = data.data['mem_usage'] ? data.data['mem_usage'] : 0;
                    } else if (data.code == 401) {
                        this.$store
                            .dispatch(REFRESH)
                            .then(() => { });
                    } else {
                    }
                });
        }
    }
};
</script>
