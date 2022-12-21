import Vue from 'vue'
Vue.mixin({
    methods: {
        /**
         * 仪表盘自适应
         * @param opt
         * @param length
         * @returns {{}}
         */
        resizeECharts(opt, length) {
            let option = {};
            if (length < 160) {
                const miniSerie = {
                    axisLabel: {
                        show: false,
                    },
                    progress: {
                        width: 6
                    },
                    pointer: {
                        show: false
                    },
                    anchor: {
                        show: false
                    },
                    detail: {
                        fontSize: 18,
                        offsetCenter: [0, 0],
                    }
                };
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
                            width: 12
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
                            fontSize: 16,
                            offsetCenter: opt.series[0].detail.offsetCenter ? opt.series[0].detail.offsetCenter : [0, '40%'],
                        }
                    };
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

                    option.series[i].detail.fontSize = opt.series[i].detail.fontSize ? opt.series[i].detail.fontSize : 30;

                }
            }
            return option;
        }
    }
});

const getEchartsItemConfig = (opt, v, i = 0) => {
    const e = v.split(".");
    if (!opt.series[i][e[0]]) return true;
    if (!opt.series[i][e[0]][e[1]]) return true;
    return opt.series[i][e[0]][e[1]];
}