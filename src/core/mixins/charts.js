import Vue from 'vue'
Vue.mixin({
    props: {
        w: {
            type: [Number,String],
            default: "100%"
        },
        h: {
            type: [Number, String],
            default: "100%"
        },
    },
    data() {
        return {
            myChart: null
        }
    },
    watch: {
        w() {if (this.myChart) this.myChart.resize();},
        h() {if (this.myChart) this.myChart.resize();}
    },
    methods: {
        /**
         * 仪表盘自适应
         * @param opt
         * @param length
         * @returns {{}}
         */
        resizeECharts(opt, length) {
            if (!opt || opt.controlType =="history") return {};
            let option = {};
            if (length < 160) {
                const miniSerie = {
                    axisLabel: {
                        show: false,
                    },
                    progress: {
                        width: opt.series[0].progress.width ? opt.series[0].progress.width : 6
                    },
                    pointer: {
                        show: false
                    },
                    anchor: {
                        show: false
                    },
                    detail: {
                        formatter: opt.series[0].detail.formatter ? opt.series[0].detail.formatter : "{value}",
                        offsetCenter: [0, 0],
                    }
                };
                console.log("=====", opt.series[0])
                miniSerie.detail.fontSize = !opt.series[0].axisLabel.show && !opt.series[0].progress.show
                && !opt.series[0].pointer.show ? opt.series[0].detail.fontSize : 18;

                const series = opt.series.map(() => miniSerie)
                option = {series}
            } else if (length < 200) {
                let series = [];
                for (let i = 0; i < opt.series.length; i++) {
                    let serie = {
                        axisLabel: {
                            show: getEchartsItemConfig(opt, "axisLabel.show", i),
                            distance: 0,
                            fontSize: 10
                        },
                        progress: {
                            width: opt.series[i].progress.width ? opt.series[i].progress.width : 12
                        },
                        pointer: {
                            show: getEchartsItemConfig(opt, "pointer.show", i),
                            width: 6
                        },
                        anchor: {
                            show: getEchartsItemConfig(opt, "anchor.show", i),
                            size: 5
                        },
                        detail: {
                            formatter: opt.series[0].detail.formatter ? opt.series[0].detail.formatter : "{value}",
                            offsetCenter: opt.series[i].detail.offsetCenter ? opt.series[i].detail.offsetCenter : [0, '40%'],
                        }
                    };
                    serie.detail.fontSize = !opt.series[i].axisLabel.show && !opt.series[i].progress.show
                        && !opt.series[i].pointer.show ? opt.series[i].detail.fontSize : 16
                    series.push(serie);
                }
                option = { series }
            } else if (length >= 200) {
                option = JSON.parse(JSON.stringify(opt));
                for (let i = 0; i < option.series.length; i++) {
                    let serie = option.series[i];
                    if (!serie.axisLabel) serie.axisLabel = {};
                    serie.axisLabel.show = getEchartsItemConfig(opt, "axisLabel.show", i);

                    if (!serie.progress) serie.progress = {};
                    serie.progress.show = getEchartsItemConfig(opt, "progress.show", i);

                    if (!serie.pointer) serie.pointer = {};
                    serie.pointer.show = getEchartsItemConfig(opt, "pointer.show", i);

                    if (!serie.anchor) serie.anchor = {};
                    serie.anchor.show = getEchartsItemConfig(opt, "anchor.show", i);

                    option.series[i].detail.formatter = opt.series[i].detail.formatter ? opt.series[i].detail.formatter : "{value}",
                    option.series[i].detail.fontSize = opt.series[i].detail.fontSize ? opt.series[i].detail.fontSize : 30;
                }

            }
            console.log("====charts.mixin.option2", option)

            return option;
        }
    }
});

const getEchartsItemConfig = (opt, v, i = 0) => {
    const e = v.split(".");
    console.log("====getEchartsItemConfig", v, opt.series[i][e[0]])
    if (!opt.series[i][e[0]]) return true;
    if (opt.series[i][e[0]][e[1]] == undefined) return true;
    console.log("====getEchartsItemConfig", v, opt.series[i][e[0]], opt.series[i][e[0]][e[1]])
    return opt.series[i][e[0]][e[1]];
}