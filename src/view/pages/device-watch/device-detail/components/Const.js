
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
    { key: 86400, label: "最近一天", aggregate: 300 },
    { key: 259200, label: "最近三天", aggregate: 600 },
    { key: 604800, label: "最近一周", aggregate: 1800 },
    { key: 2592000, label: "最近一月", aggregate: 3600 },
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

const getAggregateWindowList = (periodKey) => {
    let list = JSON.parse(JSON.stringify(AggregateWindowList));
    const period = PeriodList.find(item => item.key === periodKey);
    let sel = "no_aggregate";
    if (period.aggregate) {
        for (let i = 0; i < list.length ; i++) {
            const item = list[i];
            if (period.aggregate > item.sec  || item.key === "no_aggregate") {
                item.disabled = true;
                sel = list[i+1].key;
            }
        }
    }
    return { list, sel };
}


const AggregateFuncList = {
    "avg": "平均值",
    "max": "最大值",
    "minimum": "最小值",
    "median": "中位数",
    "first": "首位数",
    "last": "末尾数",
    "range": "首尾差值",
    "count": "次数统计",
    "sum": "求和"
  };


export {
    PeriodList,
    getAggregateWindowList,
    AggregateWindowList,
    AggregateFuncList
}