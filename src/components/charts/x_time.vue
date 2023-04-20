<template>
    <echarts
            v-loading="loading"
            element-loading-text="Loading..."
            :theme="theme"
            ref="chart"
            class="chart"
            @click="handleChartClick"
            @init="chartInit"
            :auto-resize="true"
            :options="options">
    </echarts>
</template>
<script>
    export default {
        name: 'XTime',
        props: {
            loading: {
                type: Boolean,
                default: true,
            },
            legend: {
                type: Boolean,
                default: true,
            },
            apiData: {
                type: Object
            },
            title: {
                type: String,
                default: '',
            },
            fields: {
                type: Object,
            },
            colorStart: {
                type: String,
                default: '#7956EC',
            },
            colorEnd: {
                type: String,
                default: '#3CECCF',
            },
        },
        data() {
            return {
                chart: null,
                options: {
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
                    tooltip: {
                        trigger: 'axis',
                        formatter: function (params) {
                            params = params[0];
                            return params.name;
                        },
                        axisPointer: {
                            animation: false
                        }
                    },
                    xAxis: {
                        type: 'time',
                        splitLine: {
                            show: false
                        },
                        axisLabel:{
                            textStyle: {
                                color: '#a8c5ff'
                            }
                        },
                        axisLine:{
                            lineStyle:{
                                color:'#333333',
                                width:1,
                            }
                        }
                    },
                    yAxis: {
                        type: 'value',
                        boundaryGap: [0, '100%'],
                        splitLine: {
                            show: false
                        },
                        axisLabel:{
                            textStyle: {
                                color: '#a8c5ff'
                            }
                        },
                        axisLine:{
                            lineStyle:{
                                color:'#333333',
                                width:1,
                            }
                        }
                    },
                    series: [{
                        name: 'Series',
                        type: 'line',
                        showSymbol: false,
                        hoverAnimation: false,
                        data: []
                    }]
                }
            };
        },
        computed: {},
        watch: {
            apiData: {
                immediate: true,
                handler(val, oldVal) {
                    var _this = this;
                    if (!_this.loading) {
                        _this.initChart();
                    }
                },
            },
            colorStart() {
                this.initChart();
            },
            colorEnd() {
                this.initChart();
            },
            legend(val, oldVal) {
                this.chart.setOption({
                    legend: {
                        show: val,
                    },
                });
            },
        },
        methods: {
            handleChartClick(param) {
                console.log(param);
            },

            /**
             * echarts instance init event
             * @param {object} chart echartsInstance
             */
            chartInit(chart) {
                this.chart = chart;
                // must resize chart in nextTick
                this.$nextTick(() => {
                    this.resizeChart();
                });
            },

            /**
             * emit chart component init event
             */
            emitInit() {
                if (this.$refs.chart) {
                    this.chart = this.$refs.chart.chart;
                    this.$emit('init', {
                        chart: this.chart,
                        chartData: this.apiData,
                    });
                }
            },

            /**
             * resize chart
             */
            resizeChart() {
                /* eslint-disable no-unused-expressions */
                this.chart && this.chart.resize();
            },

            /**
             * init chart
             */
            initChart() {
                for (let field in this.fields) {
                    this.chart.setOption({
                        series: [{
                            data: JSON.parse(JSON.stringify(this.apiData[field].values)),
                            itemStyle : {
                                normal : {
                                    lineStyle:{
                                        color:'#1FC96E'
                                    }
                                }
                            },
                        }]
                    });
                }
            }
        },

        async mounted() {
            this.emitInit();
        }
    };
</script>
<style lang="scss" scoped>

</style>
