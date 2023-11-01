<!--
  设备总数
  消息总数
  设备在线/离线率
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
        <div class="col-md-6">
            <div class="panel-bg-blue px-6 py-4 rounded">
                <div class="text-muted">设备在线/离线率</div>
                <div class="chart_height device-status">
                    <!-- 设备在线/离线率 -->
                    <div style="width: 100%;height: 100%;background-color: transparent" ref="main_device_status"></div>

                </div>
            </div>
        </div>
    </div>
</template>

<script>
import ApiService from "@/core/services/api.service";
import { local_url } from "@/api/LocalUrl"
import { REFRESH } from "@/core/services/store/auth.module";
import NumberChart from "@/components/e-charts/NumberChart";
import DashboardChart from "@/components/e-charts/DashboardChart";
import "@/core/mixins/charts.js"
import { getDeviceStatusCount } from "@/api/device.js";
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
            // 设备在线率
            onlinePercent: 0,
            // 设备离线率
            offlinePercent: 0,
            timer: null,
            // 仪表盘
            myChart: null,
            option: {
                legend: {
                    data: ['设备在线率', '设备离线率'], // 图例数据
                    orient: 'vertical', // 水平排列
                    left: '2%', // 图例位置，距离左边的距离
                    top: '20%', // 距离上边的距离
                    textStyle: {
                        color: '#FFFFFF' // 设置文本颜色为白色
                    }
                },
                series: [
                    {
                        name: '设备在线率',
                        type: 'gauge',
                        center: ['45%', '50%'], // 第一个仪表盘的位置
                        radius: '100%', // 仪表盘的大小
                        itemStyle: {
                            color: '#6C77FF' // 设置为白色
                        },
                        title: {
                            show: true,
                            offsetCenter: [0, '75%'], // 调整标题位置到底部
                            textStyle: {
                                fontSize: 14,
                                color: '#ffffff'
                            }
                        },
                        detail: {
                            show: true,
                            offsetCenter: [0, 0],
                            formatter: '{value}%',
                            textStyle: {
                                fontSize: 20,
                                color: '#ffffff'
                            }
                        },
                        data: [{ value: 80, name: '在线率' }],
                        axisLine: {
                            lineStyle: {
                                color: [[1, '#6C77FF']]
                            }
                        },
                        splitLine: {
                            show: false
                        },
                        axisTick: {
                            show: false
                        },
                        pointer: {
                            show: false,
                            length: '60%',
                            width: 4
                        },
                        axisLabel: {
                            show: false
                        }
                    },
                    {
                        name: '设备离线率',
                        type: 'gauge',
                        center: ['75%', '60%'], // 第二个仪表盘的位置
                        radius: '60%', // 仪表盘的大小
                        itemStyle: {
                            color: '#FF6C6B' // 设置为白色
                        },
                        title: {
                            show: true,
                            offsetCenter: [0, '90%'], // 调整标题位置到底部
                            textStyle: {
                                fontSize: 14,
                                color: '#ffffff'
                            }
                        },
                        detail: {
                            show: true,
                            offsetCenter: [0, 0],
                            formatter: '{value}%',
                            textStyle: {
                                fontSize: 18,
                                color: '#ffffff'
                            }
                        },
                        data: [{ value: 20, name: '离线率' }],
                        axisLine: {
                            lineStyle: {
                                color: [[1, '#FF6C6B']]
                            }
                        },
                        splitLine: {
                            show: false
                        },
                        axisTick: {
                            show: false
                        },
                        pointer: {
                            show: false,
                            length: '50%',
                            width: 4
                        },
                        axisLabel: {
                            show: false
                        }
                    }
                ]
            }
        }
    },
    created() {
        const flush = () => {
            this.ajaxdata();
            this.flushDeviceStatusCount();
        }
        flush();
        this.timer = setInterval(flush, 10000);
    },
    beforeDestroy() {
        clearInterval(this.timer);
    },
    mounted() {
        this.initEcharts();
    },
    methods: {
        initEcharts() {
            this.$nextTick(() => {
                this.myChart = this.$echarts.init(this.$refs["main_device_status"], null, { renderer: 'svg' });
                this.myChart.setOption(this.option);
            });
        },
        /**
         * @description: 刷新设备在线/离线总数
         * @return {*}
         */
        async flushDeviceStatusCount() {
            let { data: result } = await getDeviceStatusCount({});
            const { all, online } = result.data;
            let onlinePercent = Number(Number((online / all) * 100).toFixed(0));
            let offlinePercent = Number(Number(((all - online) / all * 100)).toFixed(0));
            let series =  [
                { data: [{ value: onlinePercent }] },
                {data: [{ value: offlinePercent }]}
            ]
            this.myChart.setOption({ series });
        },
        ajaxdata() {
            ApiService.post(local_url + (local_url.endsWith("/") ? "api" : "/api") + "/home/list")
                .then(({ data }) => {
                    if (data.code == 200) {
                        this.deviceTotal = data.data.device ? data.data.device : 0;
                        this.messageTotal = data.data.msg ? data.data.msg : 0;
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

<style scoped>
/*.panel-bg-blue{background: #2d3d88;}*/
.text-muted {
    color: #ffffff !important;
}

.title-num {
    font-size: 18px;
}

.chart_height {
    height: 130px;
}

.device-status {
    display: flex;
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
}
</style>