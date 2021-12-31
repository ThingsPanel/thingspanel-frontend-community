<template>
    <div class="row">
        <div class="col-md-3">
            <div class="panel-bg-blue px-6 py-4 rounded">
                <div class="text-muted">{{ $t("COMMON.TITLE17") }}</div>
                <div class="chart_height text-white title-num">
                    <!--{{business}}-->
                    <echarts
                            id="chart_equ"
                            ref="chart"
                            class="chart_equheight width-100"
                            :auto-resize="true"
                            :options="options_equ">
                    </echarts>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="panel-bg-blue px-6 py-4 rounded">
                <div class="text-muted">{{ $t("COMMON.TITLE18") }}</div>
                <div class="chart_height text-white title-num">
                    <!--{{conditions}}-->
                    <echarts
                            id="chart_news"
                            ref="chart"
                            class="chart_equheight width-100"
                            :auto-resize="true"
                            :options="options_news">
                    </echarts>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="panel-bg-blue px-6 py-4 rounded">
                <div class="text-muted">{{ $t("COMMON.TITLE19") }}</div>
                <div class="chart_height">
                    <echarts
                        id="chart_cpu"
                        ref="chart"
                        class="chart_height home_chart"
                        :auto-resize="true"
                        :options="options_cpu">
                    </echarts>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="panel-bg-blue px-6 py-4 rounded">
            <div class="text-muted">{{ $t("COMMON.TITLE20") }}</div>
            <div class="chart_height">
                <echarts
                        id="chart_ram"
                        ref="chart"
                        class="chart_height home_chart"
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
    .chart_height{height: 130px;}
    .home_chart{width: 150px;height: 150px;margin: 0 auto;    position: relative;bottom: 18px;}
    .chart_equheight{height: 110px;border-bottom: 1px solid rgba(91,146,255,0.15);position: relative;bottom: 0px;}
    @media only screen and (min-width:1000px) and (max-width: 1200px){
        .chart_height{height: 130px;}
        .home_chart{width: 150px;height: 150px;}
        .chart_equheight{height: 110px;}
    }
    @media only screen and (min-width:1280px) and (max-width: 1366px) {
        .chart_height {height: 130px;}
        .home_chart {width: 150px;height: 150px;}
        .chart_equheight {height: 110px;}
    }
    @media only screen and (min-width:1681px) and (max-width:1920px){
        .chart_height{height: 130px;}
        .home_chart{width: 150px;height: 150px;}
        .chart_equheight{height: 110px;}
    }
    @media only screen and (min-width:1921px){
        .chart_height{height: 180px;}
        .home_chart{width: 200px;height: 200px;}
        .chart_equheight{height: 150px;}
    }
    @media only screen and (max-width:1680px){
        .chart_height{height: 180px;}
        .home_chart{width: 200px;height: 200px;}
        .chart_equheight{height: 150px;}
    }
    @media only screen and (max-width: 1366px){
        .chart_height{height: 100px;}
        .home_chart{width: 120px;height: 120px;}
        .chart_equheight{height: 90px;}
    }
</style>
<script>
    import ApiService from "@/core/services/api.service";
    import AUTH from "@/core/services/store/auth.module";
    import { REFRESH } from "@/core/services/store/auth.module";
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
                options_cpu: {},
                options_ram: {},
                options_equ: {
                    title: {
                        text: ''
                    },
                    legend: {
                        data: []
                    },
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: {
                            type: 'shadow'
                        }
                    },
                    grid: {
                        containLabel: true,
                        left: 0,
                        bottom:'10px',
                    },
                    yAxis: {
                        data: [],
                        inverse: true,
                        axisLine: {show: false},
                        axisTick: {show: false},
                        axisLabel: {
                            margin: 0,
                            fontSize: 14,
                        },
                        axisPointer: {
                            label: {
                                show: true,
                                margin: 0
                            }
                        }
                    },
                    xAxis: {
                        splitLine: {show: false},
                        axisLabel: {show: false},
                        axisTick: {show: false},
                        axisLine: {show: false}
                    },
                    series: [{
                        itemStyle: {
                            color: '#f7b033'
                        },
                        name: '设备',
                        type: 'pictorialBar',
                        label: {
                            normal: {
                                show: true,
                                position: 'left,top',
                                offset: [0, -30],
                                textStyle: {
                                    fontSize: 20
                                },
                                color:'#fff'
                            }
                        },
                        symbolRepeat: true,
                        symbolSize: ['20%', '100%'],
                        barCategoryGap: '0%',
                        data: [{
                            value: 35,
                            symbol: 'media/bg/chart-img.png',
                        }]
                    }]
                },
                options_news: {
                    title: {
                        text: ''
                    },
                    legend: {
                        data: []
                    },
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: {
                            type: 'shadow'
                        }
                    },
                    grid: {
                        containLabel: true,
                        left: 0,
                        bottom:'10px',
                    },
                    yAxis: {
                        data: [],
                        inverse: true,
                        axisLine: {show: false},
                        axisTick: {show: false},
                        axisLabel: {
                            margin: 0,
                            fontSize: 14,
                        },
                        axisPointer: {
                            label: {
                                show: true,
                                margin: 0
                            }
                        }
                    },
                    xAxis: {
                        splitLine: {show: false},
                        axisLabel: {show: false},
                        axisTick: {show: false},
                        axisLine: {show: false}
                    },
                    series: [{
                        itemStyle: {
                            color: '#F85778'
                        },
                        name: '设备',
                        type: 'pictorialBar',
                        label: {
                            normal: {
                                show: true,
                                position: 'left,top',
                                offset: [0, -30],
                                textStyle: {
                                    fontSize: 20
                                },
                                color:'#fff'
                            }
                        },
                        symbolRepeat: true,
                        symbolSize: ['15%', '100%'],
                        barCategoryGap: '0%',
                        data: [{
                            value: 0,
                            symbol: 'media/bg/chart-img.png',
                            barMinHeight:'60%'
                        }]
                    }]
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
                ApiService.post(AUTH.local_url+"/home/list")
                    .then(({ data }) => {
                        if (data.code == 200) {
                            this.options_equ.series[0]['data'][0]['value'] = data.data.device;
                            this.options_news.series[0]['data'][0]['value'] = data.data.msg;
                            this.gaugeimg('chart_cpu', '', 0, 100, data.data.cpu_usage, '%');
                            this.gaugeimg_ram('chart_ram', '', 0, 100, data.data.mem_usage, '%');
                        }else if(data.code == 401){
                            this.$store
                                .dispatch(REFRESH)
                                .then(() => {});
                        }else{

                        }
                    });
            },
            gaugeimg(id, title, min, max, val, unit) {
                // var myChart = chart.init(document.getElementById(id)); //初始化

                this.options_cpu = {
                    title: {
                        text: title,
                        x: 'center',
                        y: '48%',
                        textStyle: { // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                            color: '#4E4DB0',
                            fontWeight: 'bolder',
                            "fontSize": 13
                        },
                    },
                    tooltip: {
                        formatter: "{a} <br/>{b} : {c}" + unit
                    },
                    toolbox: {
                        show: false,
                        feature: {
                            mark: {
                                show: true
                            },
                            restore: {
                                show: true
                            },
                            saveAsImage: {
                                show: true
                            }
                        }
                    },
                    series: [{
                        // center: ['50%', '55%'],
                        center: ['50%', '70%'],
                        // number: [0, '100%'],
                        startAngle: 210, //仪表盘起始角度
                        endAngle: -30, //仪表盘结束角度
                        //min: min,
                        //max: max,
                        splitNumber: 10, //分割段数
                        name: title,
                        type: 'gauge',
                        radius: '90%',
                        axisLine: { // 坐标轴线
                            lineStyle: { // 属性lineStyle控制线条样式
                                color: [
                                    [0.25, '#ddd'],
                                    [1, '#ddd']
                                ],
                                width: 3
                            }
                        },
                        axisTick: { // 坐标轴小标记
                            show:false,
                            splitNumber: 10, // 每份split细分多少段
                            length: 10, // 属性length控制线长
                            lineStyle: { // 属性lineStyle控制线条样式
                                color: '#ddd'
                            }
                        },
                        axisLabel: { // 坐标轴文本标签，详见axis.axisLabel
                            show:true,
                            textStyle: { // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                                color: '#88adf6',
                                fontSize: 12,
                            },
                            "padding": [-5, -5],
                        },
                        splitLine: { // 分隔线
                            show: true, // 默认显示，属性show控制显示与否
                            length: 10, // 属性length控制线长
                            lineStyle: { // 属性lineStyle（详见lineStyle）控制线条样式
                                color: 'auto'
                            }
                        },
                        pointer: { //指针粗细
                            show:true,
                            width: 3
                        },
                        title: {
                            textStyle: { // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                                fontWeight: 'bolder',
                                color: "#9b9b9b",
                                fontSize: 14,
                            },
                            "show": true,
                            "offsetCenter": [0, "-110%"],
                            "padding": [5, 5],
                            "fontSize": 14,
                        },
                        detail: {
                            formatter: '{value}' + unit,
                            textStyle: { // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                                color: '#fff',
                                // fontWeight: 'bolder',
                                "fontSize": 18
                            },
                            "offsetCenter": [0, "50%"],
                        },

                        data: [{
                            //value: val,
                            //name: name
                        }]
                    }]
                };
                this.options_cpu.series[0].min = min;
                this.options_cpu.series[0].max = max;
                this.options_cpu.series[0].data[0].value = val;
                this.options_cpu.series[0].axisLine.lineStyle.color[0][0] = (val - min) / (max - min);
                this.options_cpu.series[0].axisLine.lineStyle.color[0][1] = this.detectionData(val, id, '#3dd35c');
                // myChart.setOption(option);
            },
            gaugeimg_ram(id, title, min, max, val, unit) {
                // var myChart = chart.init(document.getElementById(id)); //初始化

                this.options_ram = {
                    title: {
                        text: title,
                        x: 'center',
                        y: '48%',
                        textStyle: { // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                            color: '#4E4DB0',
                            fontWeight: 'bolder',
                            "fontSize": 13
                        },
                    },
                    tooltip: {
                        formatter: "{a} <br/>{b} : {c}" + unit
                    },
                    toolbox: {
                        show: false,
                        feature: {
                            mark: {
                                show: true
                            },
                            restore: {
                                show: true
                            },
                            saveAsImage: {
                                show: true
                            }
                        }
                    },
                    series: [{
                        // center: ['50%', '55%'],
                        center: ['50%', '70%'],
                        // number: [0, '100%'],
                        startAngle: 210, //仪表盘起始角度
                        endAngle: -30, //仪表盘结束角度
                        //min: min,
                        //max: max,
                        splitNumber: 10, //分割段数
                        name: title,
                        type: 'gauge',
                        radius: '90%',
                        axisLine: { // 坐标轴线
                            lineStyle: { // 属性lineStyle控制线条样式
                                color: [
                                    [0.25, '#ddd'],
                                    [1, '#ddd']
                                ],
                                width: 5
                            }
                        },
                        axisTick: { // 坐标轴小标记
                            show:false,
                            splitNumber: 10, // 每份split细分多少段
                            length: 18, // 属性length控制线长
                            lineStyle: { // 属性lineStyle控制线条样式
                                color: '#ddd'
                            }
                        },
                        axisLabel: { // 坐标轴文本标签，详见axis.axisLabel
                            show:true,
                            textStyle: { // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                                color: '#88adf6',
                                fontSize: 12,
                            },
                            "padding": [-5, -5],
                        },
                        splitLine: { // 分隔线
                            show: true, // 默认显示，属性show控制显示与否
                            length: 10, // 属性length控制线长
                            lineStyle: { // 属性lineStyle（详见lineStyle）控制线条样式
                                color: 'auto'
                            }
                        },
                        pointer: { //指针粗细
                            show:true,
                            width: 3
                        },
                        title: {
                            textStyle: { // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                                fontWeight: 'bolder',
                                color: "#9b9b9b",
                                fontSize: 14,
                            },
                            "show": true,
                            "offsetCenter": [0, "-110%"],
                            "padding": [5, 10],
                            "fontSize": 14,
                        },
                        detail: {
                            formatter: '{value}' + unit,
                            textStyle: { // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                                color: '#fff',
                                // fontWeight: 'bolder',
                                "fontSize": 18
                            },
                            "offsetCenter": [0, "50%"],
                        },

                        data: [{
                            //value: val,
                            //name: name
                        }]
                    }]
                };
                this.options_ram.series[0].min = min;
                this.options_ram.series[0].max = max;
                this.options_ram.series[0].data[0].value = val;
                this.options_ram.series[0].axisLine.lineStyle.color[0][0] = (val - min) / (max - min);
                this.options_ram.series[0].axisLine.lineStyle.color[0][1] = this.detectionData(val, id,'#5B92FF');
                // myChart.setOption(option);
            },
            /*颜色设置*/
            detectionData(str, id, color) {
                var color = {
                    // type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 1,
                    y2: 0,
                    colorStops: [{
                        offset: 0, color: color, // 0%
                    }, {
                        offset: 1, color: color, // 100%
                    }],
                };
                // this.options_cpu.series[0].data[0].name = '优';
                if (str >= 101 && str <= 200) {
                    color={
                        // type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 1,
                        y2: 0,
                        colorStops: [{
                            offset: 0, color: color, // 0%
                        }, {
                            offset: 1, color: color, // 100%
                        }],
                    };
                    // this.options_cpu.series[0].data[0].name = '良';
                }
                if (str >= 201 && str <= 300) {
                    color={
                        // type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 1,
                        y2: 0,
                        colorStops: [{
                            offset: 0, color: color, // 0%
                        }, {
                            offset: 1, color: color, // 100%
                        }],
                    };
                    // this.options_cpu.series[0].data[0].name = '轻度污染';
                }
                if (str >= 301 && str <= 400) {
                    color={
                        // type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 1,
                        y2: 0,
                        colorStops: [{
                            offset: 0, color: color, // 0%
                        }, {
                            offset: 1, color: color, // 100%
                        }],
                    };
                    // this.options_cpu.series[0].data[0].name = '中度污染';
                }
                if (str >= 401 && str <= 500) {
                    color={
                        // type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 1,
                        y2: 0,
                        colorStops: [{
                            offset: 0, color: color, // 0%
                        }, {
                            offset: 1, color: color, // 100%
                        }],
                    };
                    // this.options.series[0].data[0].name = '重度污染';
                }
                this.options_cpu.series[0].axisLine.lineStyle.width = '5'; //重置仪表盘轴线宽度
                this.options_cpu.series[0].axisTick.length = '16'; //重置仪表盘刻度线长度
                this.options_cpu.series[0].title.color = color.colorStops[1].color; //字体颜色和轴线颜色一致
                this.options_cpu.series[0].title.fontSize = 10; //第一个字体变大
                return color;
            },
        }
    };
</script>
