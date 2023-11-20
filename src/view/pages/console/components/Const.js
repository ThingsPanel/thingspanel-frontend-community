
/**
 * 曲线图采样区间列表
 */
const PeriodList = [
    { key: 'custom', label: "自定义区间" },
    { key: 300, label: "最近5分钟" },
    { key: 900, label: "最近15分钟" },
    { key: 1800, label: "最近半小时" },
    { key: 3600, label: "最近1小时" },
    { key: 10800, label: "最近3小时" },
    { key: 21600, label: "最近6小时", aggregate: 60 },
    { key: 43200, label: "最近12小时", aggregate: 120 },
    { key: 86400, label: "最近一天", aggregate: 300 },
    { key: 259200, label: "最近三天", aggregate: 600 },
    { key: 604800, label: "最近7天", aggregate: 1800 },
    { key: 1296000, label: "最近15天", aggregate: 3600 },
    { key: 2592000, label: "最近30天", aggregate: 3600 },
    { key: 5184000, label: "最近60天", aggregate: 10800 },
    { key: 7776000, label: "最近90天", aggregate: 21600 },
    { key: 15552000, label: "最近半年", aggregate: 21600 },
    { key: 31536000, label: "最近一年", aggregate: 2592000 }
]


/**
 * 曲线图聚合间隔
 */
const AggregateWindowList = [
    { key: "no_aggregate", label: "不聚合", disabled: false },
    { key: "30s", label: "30秒", sec: 30, disabled: false },
    { key: "1m", label: "1分钟", sec: 60, disabled: false },
    { key: "2m", label: "2分钟", sec: 120, disabled: false },
    { key: "5m", label: "5分钟", sec: 300, disabled: false },
    { key: "10m", label: "10分钟", sec: 600, disabled: false },
    { key: "30m", label: "30分钟", sec: 1800, disabled: false },
    { key: "1h", label: "1小时", sec: 3600, disabled: false },
    { key: "3h", label: "3小时", sec: 10800, disabled: false },
    { key: "6h", label: "6小时", sec: 21600, disabled: false },
    { key: "1d", label: "1天", sec: 86400, disabled: false },
    { key: "7d", label: "7天", sec: 604800, disabled: false },
    { key: "1mo", label: "1月", sec: 2592000, disabled: false }
];

const AggregateFuncList = [
    { key: "avg", label: "平均值", disabled: false },
    { key: "max", label: "最大值", disabled: false },
    { key: "minimum", label: "最小值", disabled: true },
    { key: "median", label: "中位数", disabled: true },
    { key: "first", label: "首位数", disabled: true },
    { key: "last", label: "末尾数", disabled: true },
    { key: "range", label: "首尾差值", disabled: true },
    { key: "count", label: "次数统计", disabled: true },
    { key: "sum", label: "求和", disabled: true }
  ]

const LoadingState = {
    // 图表未渲染
    UNRENDERED: -1,
    // 图表已渲染或已加载完毕
    FINISHED: 0,
    // 加载中
    LOADING: 1,
}

const getAggregateWindowList = (periodKey) => {
    let list = JSON.parse(JSON.stringify(AggregateWindowList));
    const period = PeriodList.find(item => item.key === periodKey);
    let sel = "no_aggregate";
    if (period && period.aggregate) {
        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            if (period.aggregate > item.sec || item.key === "no_aggregate") {
                item.disabled = true;
                sel = list[i + 1].key;
            }
        }
    }
    return { list, sel };
}

const calcAggregate = (startTime, endTime) => {
    const start = new Date(startTime); // 起始时间
    const end = new Date(endTime); // 结束时间

    const duration = Math.abs(end - start); // 时间间隔的毫秒数
    const seconds = Math.floor(duration / 1000); // 转换为秒数
    let periodKey = "no_aggregate";
    for (let i = PeriodList.length-1; i > 0; i--) {
        const period = PeriodList[i];
        if (seconds > period.key) {
            return periodKey;
        }
        periodKey = period.key;

    }
    return periodKey;
}

const getSeriesData = (time_series) => {
    if (time_series && time_series.length > 0) {
        return time_series.map(item => [Number((item.x / 1000).toFixed(0)), Number(item.y.toFixed(2))])
    }
    return [];
}

const getSeries = (data, series) => {
    for (let i = 0; i < data.length; i++) {
        data[i].title = series[i].name;
    }
    return data.map(item => {
        return {
            name: item.title,
            type: "line",
            symbol: 'none', // 设置坐标点样式为空
            symbolSize: 0,
            smooth: true, 
            animation: false,  // 开启动画效果
            animationDuration: 1000,  // 动画持续时间为1秒
            animationEasing: 'quadraticOut',
            areaStyle: {
                color: 'rgba(0, 128, 255, 0.3)'  // 填充颜色和透明度
              },
            data: getSeriesData(item.time_series)
        }
    })
}

const commonProps = {
    mode: {
        type: [String],
        default: "view"
      },
      showHeader: {
        type: [Boolean],
        default: false
      },
      showConfig: {
        type: [Boolean],
        default: false
      },
      select: {
        type: [Boolean],
        default: true
      },
      option: {
        type: [Object],
        default: () => ({})
      },
      value: {
        type: [Object, String, Array],
        default: () => ({})
      },
      device: {
        type: [Object],
        default: () => ({})
      },
      status: {
        type: [Boolean, Object],
        default: () => ({})
      }
}



export {
    PeriodList,
    AggregateWindowList,
    AggregateFuncList,
    LoadingState,
    getAggregateWindowList,
    calcAggregate,
    getSeries,
    commonProps,
}