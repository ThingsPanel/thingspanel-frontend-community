<!-- 告警信息 -->
<template>
    <div class="row">
        <div class="col-md-8">
            <div class="panel-bg-blue px-6 py-4 rounded">
                <!-- <div class="text-muted" style="margin-bottom: 18px">告警信息</div> -->
                <h3 class="card-title align-items-start flex-column">
                    <span class="font-weight-bolder text-dark">
                        告警信息
                    </span>
                </h3>
                <div class="chart_height text-white title-num">
                    <el-table :data="tableData" style="width: 100%;height: 320px;">
                        <el-table-column prop="warning_name" label="名称" width="180"></el-table-column>
                        <el-table-column :label="$t('ALARM.ALARMTIME')" prop="created_at" width="180">
                            <template v-slot="scope">
                                {{ formatDate(scope.row.created_at) }}
                            </template>
                        </el-table-column>
                        <el-table-column :label="$t('ALARM.LEVEL')" prop="warning_level" width="60">
                            <template v-slot="scope">
                                {{ scope.row.warning_level === '1' ? "低" :
                                    (scope.row.warning_level === '2' ? "中" : "高") }}
                            </template>
                        </el-table-column>
                        <el-table-column label="告警内容" prop="warning_content" width="auto"></el-table-column>
                        <el-table-column :label="$t('ALARM.PROCESSING_RESULT')" prop="handle_result" width="100">
                            <template v-slot="scope">
                                {{ scope.row.processing_result === '1' ? "已处理" :
                                    (scope.row.processing_result === '2' ? "已忽略" : "未处理") }}
                            </template>
                        </el-table-column>
                    </el-table>

                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div ref="alarm_progress_id" class="panel-bg-blue  px-6 py-4 rounded">
                <div class="panel-bg-progress chart_height text-white title-num">
                    <!-- 告警信息表盘-->
                    <div class="progress-wrapper">
                        <el-progress type="circle" v-bind="progress" stroke-linecap="square"></el-progress>
                        <div class="custom-text">
                            <div class="line1">{{ progress.percentage }} %</div>
                            <div class="line2">已处理告警信息</div>
                        </div>
                    </div>
                </div>
                <div class="alarm-info">
                    <div style="margin-right: 20px">
                        <span class="circle processed"></span>
                        <span>已处理{{ progress.processed }}条</span>
                    </div>
                    <div>
                        <span class="circle unprocessed"></span>
                        <span>未处理{{ progress.unprocessed }}条</span>
                    </div>
                    
                </div>
            </div>

        </div>
    </div>
</template>
<script>
import AlarmAPI from "@/api/alarm.js";
import "@/core/mixins/common";

export default {
    name: "widget-6",
    components: {},
    data() {
        return {
            // 告警列表
            tableData: [],
            // 进度条
            progress: {
                percentage: 0,    // 进度
                strokeWidth: 16,   // 进度条宽度
                width: 100,        // 进度条画布宽
                color: "#ef9175",
                format: () => ""   // 文字内容
            },
            // 计时器
            timer: null
        }
    },
    mounted() {
        this.setProgressBarWidth();
        window.addEventListener('resize', this.setProgressBarWidth);
        const flush = () => {
            this.flushAlarmList();
            this.flushAlarmCount();
        }
        flush();
        this.timer = setInterval(flush, 10000);

        window.addEventListener("resize", () => {
            this.myChart && this.myChart.resize();
        });
       
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.setProgressBarWidth);
        if (this.timer) clearInterval(this.timer);
    },
    methods: {
        /**
         * @description: 获取告警列表
         * @return {*}
         */
        async flushAlarmList() {
            const { data: result } = await AlarmAPI.list({ current_page: 1, per_page: 5 });
            if (result.code === 200) {
                this.tableData = result.data.data || [];
            }
        },
        /**
         * @description: 刷新告警信息
         * @return {*}
         */        
         async flushAlarmCount() {
            let { data: result } = await AlarmAPI.getAlarmCount({});
            if (result.code === 200) {
                let processed = Number(result.data.processed);
                let unprocessed = Number(result.data.unprocessed);
                this.progress.percentage = processed === 0 ? 0 : Number(((processed / (processed + unprocessed)) * 100).toFixed(2));
                this.progress.processed = processed + "";
                this.progress.unprocessed = unprocessed + "";
            }
        },
        /**
         * @description: 设置进度条容器的宽
         * @return {*}
         */
        setProgressBarWidth() {
            const ref = this.$refs.alarm_progress_id
            this.progress.width = ref.offsetHeight * 0.6;
        },
        
    }
};
</script>
<style lang="scss" scoped>
.panel-bg-progress {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #2d3d88;
}

.progress-wrapper {
    position: relative;
    display: inline-block;
}

.custom-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    pointer-events: none;
    /* Ensure it doesn't interfere with the progress circle's interactivity */
}

.line1 {
    color: #ffffff;
    font-size: 28px;
}

.line2 {
    color: #ffffff;
    font-size: 16px;
}

.title-num {
    font-size: 18px;
}

.chart_height {
    min-height: 320px;
    max-height: 320px;
}

.chart_equheight {
    height: 320px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.alarm-info {
    display: flex;
    justify-content: center;
    /* 水平居中 */
    align-items: center;
    /* 垂直居中 */
    height: 40px;
    margin-bottom: 9px;

    div {
        display: flex;
        align-items: center;
        /* 垂直居中 */
        color: #ffffff;
        font-size: 16px;

        span {
            margin-right: 4px;
        }
    }
}

.circle {
    width: 16px;
    /* 宽度 */
    height: 16px;
    /* 高度 */
    border-radius: 50%;
    /* 边界半径设置为50%使其成为一个完美的圆 */
    display: flex;
    /* 使内容居中 */
    align-items: center;
    /* 垂直居中 */
    justify-content: center;
    /* 水平居中 */
}

.processed {
    background-color: red;
    /* 背景颜色 */
}

.unprocessed {
    background-color: #ccc;
    /* 背景颜色 */
}

::v-deep .el-progress__text {
    white-space: pre-line;
}


@media only screen and (min-width: 1440px) and (max-width: 1600px) {
    .chart_height {
        height: 250px;
    }

    .chart_equheight {
        height: 250px;
    }
}

@media only screen and (min-width: 1681px) and (max-width: 1920px) {
    .chart_height {
        height: 350px;
    }

    .chart_equheight {
        height: 350px;
    }
}

@media only screen and (min-width: 1920px) {
    .chart_height {
        height: 400px;
    }

    .chart_equheight {
        height: 400px;
    }
}

@media only screen and (max-width: 1680px) {
    .chart_height {
        height: 350px;
    }

    .chart_equheight {
        height: 350px;
    }
}

@media only screen and (max-width: 1366px) {
    .chart_height {
        height: 160px;
    }

    .chart_equheight {
        height: 160px;
    }
}
</style>

  