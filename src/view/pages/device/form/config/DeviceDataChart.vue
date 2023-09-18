<template>
    <!-- <el-dialog class="el-dark-dialog el-dark-input" :title="$t('DEVICE_MANAGEMENT.DEVICE_DETAIL')" width="60%"
        :visible.sync="dialogVisible" append-to-body style="height:400px"> -->
    <el-dialog id="screen" class="el-dark-dialog el-dark-input dialog-css" title="属性时序图表" width="50%"
        :close-on-press-escape="false" :fullscreen="isDialogFullScreen" show-close append-to-body
        :visible.sync="dialogVisible" @close="handleClose">
        <div>
            <!-- <div class="full-screen-div"> -->
            <el-row :gutter=10 justify="space-between">
                <el-col :span=17>
                    <el-select v-model="selectedTimeRangeOptions" style="width: 18%; " @change="changeTimeRange()">
                        <el-option v-for="item in timeRangeOptions" :key="item.value" :label="item.label"
                            :value="item.value">
                        </el-option>
                    </el-select>
                    <el-date-picker v-model="choosedTimeRange" :clearable="false" @change="handleDatePickerChange()"
                        value-format="yyyy-MM-dd HH:mm:ss" format="yyyy-MM-dd" type="datetimerange"
                        :start-placeholder="$t('DATA_MANAGEMENT.PLACEHOLDER5')"
                        :range-separator="$t('DATA_MANAGEMENT.PLACEHOLDER6')"
                        :end-placeholder="$t('DATA_MANAGEMENT.PLACEHOLDER7')" style="width:40%; margin-left:10px">
                    </el-date-picker>
                    <!-- </el-col>
                    <el-col :span=5> -->
                    <el-select v-model="selectedAggrigateOptions" style="width: 18%; margin-left:10px"
                        @change="getStatisticValue()">
                        <el-option v-for="item in aggrigateOptions" :key="item.value" :label="item.label"
                            :value="item.value" :disabled="item.disabled">
                        </el-option>
                    </el-select>
                    <el-select v-show="displayValueType" v-model="selectedValueType" style="width: 18%; margin-left:10px"
                        @change="getStatisticValue()">
                        <el-option v-for="item in valueTypeOptions" :key="item.value" :label="item.label"
                            :value="item.value">
                        </el-option>
                    </el-select>
                </el-col>
                <el-col :span=7 style="float: right;">
                    <el-button-group>
                        <el-button @click="changeChartType('line')" icon="el-icon-s-data" :type="buttonType.line"
                            style="width: 47px; border-color:#747474" :style="chartTypeOption.line"
                            size="small"></el-button>
                        <el-button @click="changeChartType('bar')" icon="el-icon-data-line" :type="buttonType.bar"
                            style="width: 47px; border-color:#747474; margin:0" :style="chartTypeOption.bar"
                            size="small"></el-button>
                        <el-button @click="changeChartType('scatter')" icon="el-icon-data-analysis" :type="buttonType.scatter"
                            style="width: 47px; border-color:#747474; margin:0" :style="chartTypeOption.scatter"
                            size="small"></el-button>
                    </el-button-group>
                    <el-button @click="getStatisticValue()" icon="el-icon-refresh-right" type="border"
                        style="width: 47px; border-color:#747474; margin-left:22px" size="small"></el-button>
                    <el-button icon="el-icon-full-screen" type="border" @click="btn"
                        style="width: 47px; border-color:#747474; margin-left:22px" size="small"></el-button>

                </el-col>

            </el-row>

            <div :style="chartStyle">
                <div style="width: 100%; height:100%;" ref="chart" id="chart"></div>
            </div>

            <div>
                <el-row type="flex" justify="space-between" align="middle"
                    style="margin: 10px; padding: 10px; background-color:#3c4c99">
                    <el-col :span=4 style="text-align: center;">
                        <div>{{ $t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.MIN') }}</div>
                        <div>{{ calculateData.min }}</div>
                    </el-col>
                    <el-col :span=4 style="text-align: center;">
                        <div>{{ $t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.MAX') }}</div>
                        <div>{{ calculateData.max }}</div>
                    </el-col>
                    <el-col :span=4 style="text-align: center;">
                        <div>{{ $t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.AVERAGE') }}</div>
                        <div>{{ calculateData.avg }}</div>
                    </el-col>
                    <el-col :span=4 style="text-align: center;">
                        <div>{{ $t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.MEDIAN') }}</div>
                        <div>{{ calculateData.med }}</div>
                    </el-col>
                    <el-col :span=4 style="text-align: center;">
                        <div>{{ $t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.SUM') }}</div>
                        <div>{{ calculateData.sum }}</div>
                    </el-col>
                    <el-col :span=4 style="text-align: center;">
                        <div>{{ $t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.DATA_COUNT') }}</div>
                        <div>{{ calculateData.cnt }}</div>
                    </el-col>
                </el-row>
            </div>

            <div style="margin-bottom: 10px;">
                <el-row type="flex" justify="end">
                    <el-col :span=2>
                        <el-popconfirm :confirm-button-text="$t('COMMON.CONFIRM')" :cancel-button-text="$t('COMMON.CANCEL')"
                            :title="$t('COMMON.EXPORT_CONFIRM')" @confirm="handleExport()">
                            <el-button slot="reference" type="border" size="medium">{{ $t('COMMON.EXPORT')
                            }}</el-button>
                        </el-popconfirm>
                    </el-col>
                </el-row>
            </div>

            <div style="width: 100%; padding-bottom: 30px">
                <el-table style="width: 100%;" :data="paginatedData">
                    <el-table-column prop="time" :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.TIMESTAMP')" min-width="180"
                        align="center">
                        <template slot-scope="scope">
                            <span>{{ transformTimestamp(scope.row.ts) }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="value" :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.VALUE')" min-width="180"
                        align="center"></el-table-column>
                    <template #empty>
                        <div>{{ $t('COMMON.TABLE_NO_DATA') }}</div>
                    </template>
                </el-table>

                <div style="float: right; margin-bottom: 20px">
                    <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="currentPage"
                        :page-sizes="[5, 10, 50]" :page-size="pageSize" layout="total, sizes, prev, pager, next"
                        :total="tableData.length">
                    </el-pagination>
                </div>
            </div>

            <el-dialog class="el-dark-dialog el-dark-input" width="30%" :title="$t('COMMON.EXPORT')"
                :visible.sync="exportVisible" append-to-body>

                <div class="text-center">
                    <p>{{ downloadUrl ? downloadUrl.split('/').pop().toString() : $t('COMMON.GENERATE_WAIT') }}</p>
                    <p v-if="!exporting">
                        <a :href="downloadUrl">{{ $t('COMMON.DOWNLOAD') }}</a>
                    </p>
                </div>

            </el-dialog>
        </div>
    </el-dialog>
</template>

<script>
import screenfull from "screenfull";
import i18n from "@/core/plugins/vue-i18n.js"
import { statistic } from "@/api/device";
import { dateFormat } from "@/utils/tool.js";

export default {
    name: "DeviceDataChart",
    props: {
        visible: {
            type: [Boolean],
            default: false
        },
        data: {
            type: Object,
            default: () => {
                return {}
            }
        },
        device: {
            type: [Object],
            default: () => { return {} }
        },
        attributeName: {
            type: String,
            default: ""
        }
    },
    data() {
        let now = Date.now();

        return {
            myEcharts: {},
            echartOptions: {},
            choosedChartType: 'line',
            defaultChartOptions: {
                line: {
                    backgroundColor: '',
                    grid: {
                        left: "4%",
                        right: "4%",
                        bottom: "10%",
                    },
                    xAxis: {
                        type: 'category',
                        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                    },
                    yAxis: {
                        type: 'value'
                    },
                    series: [
                        {
                            data: [150, 230, 224, 218, 135, 147, 260],
                            type: 'line',
                            lineStyle: {
                                width: 3,
                                color: "#1FC96E",
                            }
                        }
                    ]
                },
                bar: {
                    xAxis: {
                        type: 'category',
                        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                    },
                    yAxis: {
                        type: 'value'
                    },
                    series: [
                        {
                            data: [150, 230, 224, 218, 135, 147, 260],
                            type: 'bar'
                        }
                    ]
                },
                scatter: {
                    xAxis: {},
                    yAxis: {},
                    series: [
                        {
                            symbolSize: 3,
                            data: [
                                [10.0, 8.04],
                                [8.07, 6.95],
                                [13.0, 7.58],
                                [9.05, 8.81],
                                [11.0, 8.33],
                                [14.0, 7.66],
                                [13.4, 6.81],
                                [10.0, 6.33],
                                [14.0, 8.96],
                                [12.5, 6.82],
                                [9.15, 7.2],
                                [11.5, 7.2],
                                [3.03, 4.23],
                                [12.2, 7.83],
                                [2.02, 4.47],
                                [1.05, 3.33],
                                [4.05, 4.96],
                                [6.03, 7.24],
                                [12.0, 6.26],
                                [12.0, 8.84],
                                [7.08, 5.82],
                                [5.02, 5.68]
                            ],
                            type: 'scatter'
                        }
                    ]
                },
            },
            historyData: [],
            tableData: [],
            historyValueList: [],
            calculateData: {
                min: 0,
                max: 0,
                avg: 0,
                med: 0,
                sum: 0,
                cnt: 0,
            },
            chartTypeOption: {
                line: {
                    backgroundColor: '#409eff',
                },
                bar: {},
                scatter: {}
            },
            buttonType: {
                line: "text",
                bar: "border",
                scatter: "border",
            },
            positionShow: false,
            locationArray: [],
            isCopy: false,

            // 时间选择
            choosedTimeRange: [
                new Date(now - 1000 * 60 * 60),
                new Date(now)
            ],
            selectedTimeRangeOptions: '1_hour',
            timeRangeOptions: [
                {
                    value: 'custom',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.CUSTOM'),
                    timeRange: []
                    // Custom range, no fixed time range
                },
                // {
                //     value: '30_seconds',
                //     label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.LAST_THIRTY_SECONDS'),
                //     timeRange: [new Date(Date.now() - 30000), new Date(Date.now())]
                //     // 30 * 1000 milliseconds
                // },
                // {
                //     value: '1_minute',
                //     label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.LAST_ONE_MINUTE'),
                //     timeRange: [new Date(Date.now() - 60000), new Date(Date.now())]
                //     // 60 * 1000 milliseconds
                // },
                // {
                //     value: '2_minutes',
                //     label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.LAST_TWO_MINUTES'),
                //     timeRange: [new Date(Date.now() - 120000), new Date(Date.now())]
                //     // 2 * 60 * 1000 milliseconds
                // },
                {
                    value: '5_minutes',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.LAST_FIVE_MINUTES'),
                    timeRange: [new Date(Date.now() - 300000), new Date(Date.now())]
                    // 5 * 60 * 1000 milliseconds
                },
                // {
                //     value: '10_minutes',
                //     label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.LAST_TEN_MINUTES'),
                //     timeRange: [new Date(Date.now() - 600000), new Date(Date.now())]
                //     // 10 * 60 * 1000 milliseconds
                // },
                {
                    value: '15_minutes',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.LAST_FIFTEEN_MINUTES'),
                    timeRange: [new Date(Date.now() - 900000), new Date(Date.now())]
                    // 15 * 60 * 1000 milliseconds
                },
                {
                    value: '30_minutes',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.LAST_THIRTY_MINUTES'),
                    timeRange: [new Date(Date.now() - 1800000), new Date(Date.now())]
                    // 30 * 60 * 1000 milliseconds
                },
                {
                    value: '1_hour',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.LAST_ONE_HOUR'),
                    timeRange: [new Date(Date.now() - 3600000), new Date(Date.now())]
                    // 60 * 60 * 1000 milliseconds
                },
                {
                    value: '3_hour',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.LAST_THREE_HOURS'),
                    timeRange: [new Date(Date.now() - 10800000), new Date(Date.now())]
                    // 3 * 60 * 60 * 1000 milliseconds
                },
                // {
                //     value: '6_hour',
                //     label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.LAST_SIX_HOURS'),
                //     timeRange: [new Date(Date.now() - 21600000), new Date(Date.now())]
                //     // 6 * 60 * 60 * 1000 milliseconds
                // },
                {
                    value: '1_day',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.LAST_ONE_DAY'),
                    timeRange: [new Date(Date.now() - 86400000), new Date(Date.now())],
                    aggregateLimit: 300,
                    // 24 * 60 * 60 * 1000 milliseconds
                },
                {
                    value: '3_day',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.LAST_THREE_DAYS'),
                    timeRange: [new Date(Date.now() - 259200000), new Date(Date.now())],
                    aggregateLimit: 600,
                    // 3 * 24 * 60 * 60 * 1000 milliseconds
                },
                {
                    value: '7_day',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.LAST_SEVEN_DAYS'),
                    timeRange: [new Date(Date.now() - 604800000), new Date(Date.now())],
                    aggregateLimit: 1800,
                    // 7 * 24 * 60 * 60 * 1000 milliseconds
                },
                {
                    value: '1_month',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.LAST_ONE_MONTH'),
                    timeRange: [new Date(Date.now() - 2592000000), new Date(Date.now())],
                    aggregateLimit: 3600,
                    // Approximately 30 days, 30 * 24 * 60 * 60 * 1000 milliseconds
                },
                {
                    value: '6_month',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.LAST_SIX_MONTHS'),
                    timeRange: [new Date(Date.now() - 15552000000), new Date(Date.now())],
                    aggregateLimit: 21600,
                    // Approximately 180 days, 180 * 24 * 60 * 60 * 1000 milliseconds
                },
                {
                    value: '1_year',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.LAST_ONE_YEAR'),
                    timeRange: [new Date(Date.now() - 31104000000), new Date(Date.now())],
                    aggregateLimit: 2592000,
                    // Approximately 360 days, 360 * 24 * 60 * 60 * 1000 milliseconds
                }
            ],

            // 聚合范围
            displayValueType: false,
            selectedAggrigateOptions: 'no_aggregate',
            aggrigateOptions: [
                {
                    value: 'no_aggregate',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.NO_AGGREGATE'),
                    disabled: false,
                    sec: 0
                },
                {
                    value: '30s',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.THIRTY_SECONDS'),
                    disabled: false,
                    sec: 30
                },
                {
                    value: '1m',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.ONE_MINUTE'),
                    disabled: false,
                    sec: 60
                },
                {
                    value: '2m',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.TWO_MINUTES'),
                    disabled: false,
                    sec: 120
                },
                {
                    value: '5m',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.FIVE_MINUTES'),
                    disabled: false,
                    sec: 300
                },
                {
                    value: '10m',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.TEN_MINUTES'),
                    disabled: false,
                    sec: 600
                },
                {
                    value: '30m',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.THIRTY_MINUTES'),
                    disabled: false,
                    sec: 1800
                },
                {
                    value: '1h',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.ONE_HOUR'),
                    disabled: false,
                    sec: 3600
                },
                {
                    value: '3h',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.THREE_HOURS'),
                    disabled: false,
                    sec: 10800
                },
                {
                    value: '6h',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.SIX_HOURS'),
                    disabled: false,
                    sec: 21600
                },
                {
                    value: '1d',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.ONE_DAY'),
                    disabled: false,
                    sec: 86400
                },
                {
                    value: '7d',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.SEVEN_DAYS'),
                    disabled: false,
                    sec: 604800
                },
                {
                    value: '1mo',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.ONE_MONTH'),
                    disabled: false,
                    sec: 2592000
                },
            ],

            // 值类型
            selectedValueType: 'avg',
            valueTypeOptions: [
                {
                    value: 'avg',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.AVERAGE')
                },
                {
                    value: 'max',
                    label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.MAX')
                },
                // {
                //     value: 'min',
                //     label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.MIN')
                // },
                // {
                //     value: 'median',
                //     label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.MEDIAN')
                // },
                // {
                //     value: 'first',
                //     label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.FIRST')
                // },
                // {
                //     value: 'last',
                //     label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.LAST')
                // },
                // {
                //     value: 'first_last_diff',
                //     label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.FIRST_LAST_DIFF')
                // },
                // {
                //     value: 'count',
                //     label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.COUNT')
                // },
                // {
                //     value: 'sum',
                //     label: i18n.t('DEVICE_MANAGEMENT.DEVICE_CONFIG.RANGE.SUM')
                // },
            ]
            ,
            // 全屏切换
            bindc: true,
            isDialogFullScreen: false,
            chartStyle: {
                width: '100%',
                height: '360px',
            },
            exporting: false,
            exportVisible: false,
            downloadUrl: "",
            currentPage: 1,
            pageSize: 10,
        }
    },
    computed: {
        formData: {
            get() {
                return this.data
            },
            set(val) {
                this.$emit('update:data', val)
            }
        },
        dialogVisible: {
            get() {
                return this.visible
            },
            set(val) {
                this.$emit('update:visible', val)
            }
        },
        paginatedData() {
            const start = (this.currentPage - 1) * this.pageSize;
            const end = this.currentPage * this.pageSize;
            return this.tableData.slice(start, end);
        },
    },
    watch: {
        dialogVisible: {
            handler(newValue) {
                if (newValue) {
                    this.getStatisticValue(true);
                }
                this.$nextTick(() => {
                    this.initEChart();

                })
            },
        },
        selectedAggrigateOptions: {
            handler(newValue) {
                this.displayValueType = this.selectedAggrigateOptions !== "no_aggregate"
            },
        },
    },
    methods: {
        /**
         * 加载EChats图表
         */
        initEChart() {
            this.myEcharts = this.$echarts.init(document.getElementById('chart'), 'dark');
            this.myEcharts.setOption(this.defaultChartOptions[this.choosedChartType]);

        },
        // 图表数据转换
        transformChartData() {
            let data = this.historyData
            let xAxis = [];
            let yAxis = [];
            let valueList = [];
            let tableData = [];
            let sum = 0;
            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                if (item.hasOwnProperty("x") && item.hasOwnProperty("y")) {
                    xAxis.push(dateFormat(item.x))
                    yAxis.push(item.y)
                    valueList.push([dateFormat(item.x), item.y])
                    tableData.push({ ts: item.x, value: item.y })
                    sum += item.y;
                }
            }
            this.defaultChartOptions.line.xAxis.data = xAxis;
            this.defaultChartOptions.line.series[0].data = yAxis;
            this.defaultChartOptions.bar.xAxis.data = xAxis;
            this.defaultChartOptions.bar.series[0].data = yAxis;
            this.defaultChartOptions.scatter.series[0].data = valueList;
            this.historyValueList = yAxis;
            this.tableData = tableData;

            console.debug(this.historyData, this.defaultChartOptions)
            this.$nextTick(() => {
                this.initEChart();
            })

            let list = [].concat(yAxis).sort()

            function median(arr) {
                if (!Array.isArray(arr)) {
                    throw new TypeError('Input should be an array');
                }

                if (arr.length === 0) {
                    return 0;
                }

                const sortedArr = [...arr].sort((a, b) => a - b);
                const middleIndex = Math.floor(sortedArr.length / 2);

                if (sortedArr.length % 2 === 0) {
                    // 如果数组的长度是偶数
                    return (sortedArr[middleIndex - 1] + sortedArr[middleIndex]) / 2;
                } else {
                    // 如果数组的长度是奇数
                    return sortedArr[middleIndex];
                }
            }

            if (yAxis.length === 0) {
                this.calculateData.max = 0;
                this.calculateData.min = 0;
                this.calculateData.avg = 0;
                this.calculateData.med = 0;
                this.calculateData.sum = 0;
                this.calculateData.cnt = 0;
                return;
            }
            this.calculateData.max = Math.max(...yAxis).toFixed(2);
            this.calculateData.min = Math.min(...yAxis).toFixed(2);
            this.calculateData.avg = (sum / yAxis.length).toFixed(2);
            this.calculateData.med = median(yAxis).toFixed(2);
            this.calculateData.sum = sum.toFixed(2);
            this.calculateData.cnt = yAxis.length;
        },
        // 获取属性统计数据
        getStatisticValue(isInit = false) {
            
            let startTime, endTime;
            if(isInit){
                startTime = new Date(Date.now() - 1000 * 60 * 60).getTime() * 1000;
                endTime = new Date(Date.now()).getTime() * 1000;
            }else{
                startTime = new Date(this.choosedTimeRange[0]).getTime() * 1000;
                endTime = new Date(this.choosedTimeRange[1]).getTime() * 1000;
            }
            let params = {
                "device_id": this.device.id,
                "key": this.attributeName,
                "start_time": startTime,
                "end_time": endTime,
                "aggregate_window": this.selectedAggrigateOptions,
                "time_range": "custom",
            }
            console.debug(params, this.choosedTimeRange)
            if (this.selectedAggrigateOptions !== "no_aggregate") {
                params.aggregate_function = this.selectedValueType
            }
            statistic(params)
                .then(({ data }) => {
                    console.debug("====getHistoryData", data)
                    if (data.code == 200) {
                        // this.historyData = data.data.data ? data.data.data : []
                        this.historyData = data.data.time_series ? data.data.time_series : []
                        // this.historyData = this.historyData.length > 100 ? this.historyData.slice(-100, -1) : this.historyData

                    }
                    console.debug(this.historyData)
                    this.transformChartData()
                })

        },
        handleClose() {
            this.dialogVisible = false
            this.selectedTimeRangeOptions = "1_hour"
            this.selectedAggrigateOptions = "no_aggregate"
            let now = Date.now();

            this.timeRangeOptions = [
                new Date(now - 1000 * 60 * 60),
                new Date(now)
            ]

            this.changeChartType('line')

            console.debug("handleClose", this.dialogVisible, this.$refs, this)
            if (!this.bindc) {
                this.btn()
            }
        },
        // 根据选择框修改时间范围
        changeTimeRange() {
            if (this.selectedTimeRangeOptions !== "custom") {
                let option = this.timeRangeOptions.filter(item => item.value === this.selectedTimeRangeOptions)
                this.choosedTimeRange = option[0].timeRange;
            }

            // 根据选择范围禁用聚合范围
            let list = this.aggrigateOptions;
            const period = this.timeRangeOptions.find(item => item.value === this.selectedTimeRangeOptions);
            let sel = "";
            if (period.aggregateLimit) {
                for (let i = 0; i < list.length; i++) {
                    const item = list[i];
                    item.disabled = false;
                    if (period.aggregateLimit > item.sec || item.value === "no_aggregate") {
                        item.disabled = true;
                        sel = list[i + 1].value;
                    }
                }
                if (sel === "") {
                    sel = "no_aggregate"
                }

                this.aggrigateOptions = list;
                this.selectedAggrigateOptions = sel;
            }

            const getAggregateWindowList = (periodKey) => {
                let list = JSON.parse(JSON.stringify(AggregateWindowList));
                const period = PeriodList.find(item => item.key === periodKey);
                let sel = "";
                if (period.aggregate) {
                    for (let i = 0; i < list.length; i++) {
                        const item = list[i];
                        item.default = false;
                        if (period.aggregate > item.sec || item.key === "no_aggregate") {
                            item.disabled = true;
                            sel = list[i + 1].key;
                        }
                    }
                }
                return { list, sel };
            }
            console.debug(this.selectedTimeRangeOptions, this.selectedAggrigateOptions)

            this.getStatisticValue()
        },
        handleDatePickerChange(val) {
            this.selectedTimeRangeOptions = "custom"

            // 根据选择范围禁用聚合范围
            let list = this.aggrigateOptions;
            const period = this.timeRangeOptions.find(item => item.value === this.selectedTimeRangeOptions);
            let sel = "";
            if (period.aggregateLimit) {
                for (let i = 0; i < list.length; i++) {
                    const item = list[i];
                    item.disabled = false;
                    if (period.aggregateLimit > item.sec || item.value === "no_aggregate") {
                        item.disabled = true;
                        sel = list[i + 1].value;
                    }
                }
                if (sel === "") {
                    sel = "no_aggregate"
                }

                this.aggrigateOptions = list;
                this.selectedAggrigateOptions = sel;
            }

            const getAggregateWindowList = (periodKey) => {
                let list = JSON.parse(JSON.stringify(AggregateWindowList));
                const period = PeriodList.find(item => item.key === periodKey);
                let sel = "";
                if (period.aggregate) {
                    for (let i = 0; i < list.length; i++) {
                        const item = list[i];
                        item.default = false;
                        if (period.aggregate > item.sec || item.key === "no_aggregate") {
                            item.disabled = true;
                            sel = list[i + 1].key;
                        }
                    }
                }
                return { list, sel };
            }

            this.getStatisticValue()
        },
        // 修改图表类型
        changeChartType(buttonOption) {
            this.choosedChartType = buttonOption;
            this.buttonType = {
                line: "border",
                bar: "border",
                scatter: "border"
            }
            this.buttonType[buttonOption] = "text"
            this.chartTypeOption = {
                line: {},
                bar: {},
                scatter: {}
            }
            this.chartTypeOption[buttonOption] = {
                backgroundColor: '#647bf3',
            }
            console.debug(this.chartTypeOption)
            this.myEcharts.setOption(this.defaultChartOptions[buttonOption]);
        },
        /**
         * 全屏显示
         */
        btn() {
            this.bindc = !this.bindc;
            this.isDialogFullScreen = !this.isDialogFullScreen;
            let element = document.getElementById("screen"); //指定全屏区域元素
            screenfull.toggle(element); //全屏显示

            // 取消全屏
            if (this.bindc) {

                // 打开全屏
            } else {
                this.chartStyle = {
                    width: '100%',
                    height: '600px',
                }
            }

            this.$nextTick(() => {
                this.myEcharts = this.$echarts.init(document.getElementById('chart'));
                this.myEcharts.setOption(this.defaultChartOptions[this.choosedChartType]);
                this.myEcharts.resize();
            })
        },
        transformTimestamp(timestamp) {
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
                let sel = "";
                if (period.aggregate) {
                    for (let i = 0; i < list.length; i++) {
                        const item = list[i];
                        item.default = false;
                        if (period.aggregate > item.sec || item.key === "no_aggregate") {
                            item.disabled = true;
                            sel = list[i + 1].key;
                        }
                    }
                }
                return { list, sel };
            }
            return dateFormat(timestamp)
        },
        handleExport() {
            if (this.exporting) return
            this.exporting = true
            this.exportVisible = true

            let startTime = new Date(this.choosedTimeRange[0]).getTime() * 1000;
            let endTime = new Date(this.choosedTimeRange[1]).getTime() * 1000;
            let params = {
                "device_id": this.device.id,
                "key": this.attributeName,
                "start_time": startTime,
                "end_time": endTime,
                "aggregate_window": this.selectedAggrigateOptions,
                // "time_range": this.selectedTimeRangeOptions,
                "time_range": "custom",
                "export_excel": true
            }
            if (this.selectedAggrigateOptions !== "no_aggregate") {
                params.aggregate_function = this.selectedValueType
            }
            statistic(params)
                .then(({ data }) => {
                    console.debug("====handleExport", data)
                    if (data.code == 200) {
                        this.downloadUrl = data.data ? data.data : ""
                    }
                }).finally(() => {
                    this.exporting = false
                })
        },
        handleSizeChange(newSize) {
            this.pageSize = newSize;
        },
        handleCurrentChange(newPage) {
            this.currentPage = newPage;
        },
    }
}
</script>
<style lang="scss" scoped>
.el-form-item__content {
    margin-left: 100px;
}

.full-screen-div {
    z-index: 999;
    // background-color: transparent !important;
}

.dialog-css {}
</style>