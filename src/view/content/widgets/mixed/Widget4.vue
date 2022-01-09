<template>
    <div class="row">
        <div class="col-md-6">
            <div class="panel-bg-blue px-6 py-4 rounded">
                <div class="text-muted">{{ $t("COMMON.TITLE21") }}</div>
                <div class="chart_height text-white title-num">
                    <echarts
                            id="line_cpu"
                            ref="chart"
                            class="chart_equheight width-100"
                            :auto-resize="true"
                            :options="options_cpu">
                    </echarts>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="panel-bg-blue px-6 py-4 rounded">
                <div class="text-muted">{{ $t("COMMON.TITLE22") }}</div>
                <div class="chart_height text-white title-num">
                    <echarts
                            id="line_ram"
                            ref="chart"
                            class="chart_equheight width-100"
                            :auto-resize="true"
                            :options="options_ram">
                    </echarts>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped>
    .panel-bg-blue{background: #2d3d88;}
    .title-num{font-size: 18px;}
    .chart_height{height: 320px;}
    .chart_equheight{height: 320px;}

    @media only screen and (min-width:1440px) and (max-width:1600px){
        .chart_height{height: 250px;}
        .chart_equheight{height: 250px;}
    }
    @media only screen and (min-width:1681px) and (max-width:1920px){
        .chart_height{height: 350px;}
        .chart_equheight{height: 350px;}
    }
    @media only screen and (min-width:1920px){
        .chart_height{height: 400px;}
        .chart_equheight{height: 400px;}
    }
    @media only screen and (max-width:1680px){
        .chart_height{height: 350px;}
        .chart_equheight{height: 350px;}
    }
    @media only screen and (max-width:1366px){
        .chart_height{height: 160px;}
        .chart_equheight{height: 160px;}
    }
</style>
<script>
    import ApiService from "@/core/services/api.service";
    import AUTH from "@/core/services/store/auth.module";
    import { REFRESH } from "@/core/services/store/auth.module";
	import i18nService from "@/core/services/i18n.service.js";
    export default {
        name: "widget-2",
        components: {},
        data() {
            return {
                business: '', //业务
                assets: '', //资产
                equipment: '', //设备
                conditions: '',
                dashboard: '',
                options_cpu:  {
                    title: {
                        show: false,
                        text: this.title,
                        textStyle: {
                        align: 'center',
                        verticalAlign: 'middle',
                    },
                    top: 10,
                    left: '10',
                    },
                    legend: {
                        show: true,
                        top: 10,
                        textStyle:{
                        color:'#fff'
                        }
                        // data: [],
                    },
                    tooltip : {
                        trigger: 'axis',
                        axisPointer: {
                        type: 'cross',
                            label: {
                                backgroundColor: '#6a7985'
                            }
                        }
                    },
                    grid: {
                        top: '15%',
                        right: '2%',
                        left: '5%',
                        bottom: '10%'
                    },
                    xAxis: [
                        {
                            type: 'category',
                            boundaryGap: false,
                            axisLabel: {
                                color: '#88adf6'
                            },
                            axisLine: {
                                show: true,
                                lineStyle: {
                                    color: '#0f2486'
                                }
                            },
                            axisTick: {
                                show: true,
                            },
                            splitLine: {
                                show: false,
                                lineStyle: {
                                    color: '#0f2486'
                                }
                            },
                            data: ['8:00','9:00','10:00','11:00','12:00','13:00','14:00']
                        }
                    ],
                        yAxis: [
                        {
                            type: 'value',
                            name: '%',
                            nameTextStyle: {
                                color: '#88adf6'
                            },
                            /*min: -40,
                            max: 45,*/
                            axisLabel: {
                                formatter: '{value}',
                                textStyle: {
                                    color: '#88adf6'
                                }
                            },
                            axisLine: {
                                show: true,
                                lineStyle: {
                                    color: '#0f2486'
                                }
                            },
                            axisTick: {
                                show: false,
                            },
                            splitLine: {
                                show: false,
                            }
                        }
                    ],
                        series: [
                        {
                            name: i18nService.getActiveLanguage() == 'en' ? 'CPU footprint' : 'CPU占用',
                            type: 'line',
                            smooth: true,
                            stack: '',
                            symbol: 'emptyCircle',
                            symbolSize: 6,
                            itemStyle: {
                                normal: {
                                    color: {
                                        type: 'linear',
                                        x: 0,
                                        y: 0,
                                        x2: 1,
                                        y2: 0,
                                        colorStops: [{
                                            offset: 0, color: '#f7b033', // 0%
                                        }, {
                                            offset: 1, color: '#f85778', // 100%
                                        }],
                                    },
                                    lineStyle: {
                                        width: 2
                                    },
                                    /*areaStyle: {
                                        normal: {
                                            opacity: 0.2,
                                        },
                                    },*/
                                }
                            },
                            markPoint: {
                                itemStyle: {
                                    normal: {
                                        color: '#fff'
                                    }
                                }
                            },
                            data: [10,23,10,40,29,35,23],
                        }
                    ],
                    animationDuration: 1000,
                },
                options_ram: {
                    title: {
                        show: false,
                        text: this.title,
                        textStyle: {
                            align: 'center',
                            verticalAlign: 'middle',
                        },
                        top: 10,
                        left: '10',
                    },
                    legend: {
                        show: true,
                        top: 10,
                        textStyle:{
                            color:'#fff'
                        }
                        // data: [],
                    },
                    tooltip : {
                        trigger: 'axis',
                        axisPointer: {
                            type: 'cross',
                            label: {
                                backgroundColor: '#6a7985'
                            }
                        }
                    },
                    grid: {
                        top: '15%',
                        right: '2%',
                        left: '5%',
                        bottom: '10%'
                    },
                    xAxis: [
                        {
                            type: 'category',
                            boundaryGap: false,
                            axisLabel: {
                                color: '#88adf6'
                            },
                            axisLine: {
                                show: true,
                                lineStyle: {
                                    color: '#0f2486'
                                }
                            },
                            axisTick: {
                                show: true,
                            },
                            splitLine: {
                                show: false,
                                lineStyle: {
                                    color: '#0f2486'
                                }
                            },
                            data: ['8:00','9:00','10:00','11:00','12:00','13:00','14:00']
                        }
                    ],
                    yAxis: [
                        {
                            type: 'value',
                            name: '%',
                            nameTextStyle: {
                                color: '#88adf6'
                            },
                            /*min: -40,
                            max: 45,*/
                            axisLabel: {
                                formatter: '{value}',
                                textStyle: {
                                    color: '#88adf6'
                                }
                            },
                            axisLine: {
                                show: true,
                                lineStyle: {
                                    color: '#0f2486'
                                }
                            },
                            axisTick: {
                                show: false,
                            },
                            splitLine: {
                                show: false,
                            }
                        }
                    ],
                    series: [
                        {
                            name: i18nService.getActiveLanguage() == 'en' ? 'Memory footprint' : '内存占用',
                            type: 'line',
                            smooth: true,
                            stack: '',
                            symbol: 'emptyCircle',
                            symbolSize: 6,
                            itemStyle: {
                                normal: {
                                    color: {
                                        type: 'linear',
                                        x: 0,
                                        y: 0,
                                        x2: 1,
                                        y2: 0,
                                        colorStops: [{
                                            offset: 0, color: '#8928ea', // 0%
                                        }, {
                                            offset: 1, color: '#5384eb', // 100%
                                        }],
                                    },
                                    lineStyle: {
                                        width: 2
                                    },
                                    /*areaStyle: {
                                        normal: {
                                            opacity: 0.2,
                                        },
                                    },*/
                                }
                            },
                            markPoint: {
                                itemStyle: {
                                    normal: {
                                        color: '#fff'
                                    }
                                }
                            },
                            data: [35,22,56,11,7,25,21],
                        }
                    ],
                    animationDuration: 1000,
                },
            }
        },
        created() {
            this.ajaxdata();
            setInterval(this.ajaxdata,60000);
        },
        mounted() {
        },
        methods:{
            ajaxdata() {
                ApiService.post(AUTH.local_url+"/home/chart")
                    .then(({ data }) => {
                        if (data.code == 200) {
                            var cpu_xAxis = [],cpu_series = [],ram_xAxis = [],ram_series = [];
                            for(var i=0;i<data.data.cpu.length;i++){
                                cpu_xAxis.push(data.data.cpu[i]['created_at']);
                                cpu_series.push(data.data.cpu[i]['cpu']);
                                ram_xAxis.push(data.data.mem[i]['created_at']);
                                ram_series.push(data.data.mem[i]['mem']);
                            }
                            this.options_cpu.xAxis[0]['data'] = cpu_xAxis;
                            this.options_cpu.series[0]['data'] = cpu_series;
                            this.options_ram.xAxis[0]['data'] = ram_xAxis;
                            this.options_ram.series[0]['data'] = ram_series;
                        }else if(data.code == 401){
                            this.$store
                                .dispatch(REFRESH)
                                .then(() => {});
                        }else{

                        }
                    });
            },
        }
    };
</script>
