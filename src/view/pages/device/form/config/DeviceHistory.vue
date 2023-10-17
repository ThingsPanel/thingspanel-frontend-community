<template>
    <el-dialog class="el-dark-dialog el-dark-input" :title="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.ATTRIBUTE_HISTORY_DATA')"
        width="50%" :close-on-press-escape="false" show-close append-to-body :visible.sync="dialogVisible"
        @close="handleClose">
        <div>
            <el-row :gutter=10>
                <el-col :span=11>
                    <el-date-picker v-model="choosedTimeRange" :clearable="false" style="width: 100%;"
                        value-format="yyyy-MM-dd HH:mm:ss" @change="getHistoryData()" type="datetimerange"
                        :start-placeholder="$t('DATA_MANAGEMENT.PLACEHOLDER5')"
                        :range-separator="$t('DATA_MANAGEMENT.PLACEHOLDER6')"
                        :end-placeholder="$t('DATA_MANAGEMENT.PLACEHOLDER7')">
                    </el-date-picker>
                </el-col>
                <el-col :span=3>
                    <el-button type="border" size="medium" @click="handleRefresh()">{{
                        $t('COMMON.REFRESH') }}</el-button>
                </el-col>

                <el-col :span=3 style="float: right;">
                    <el-popconfirm :confirm-button-text="$t('COMMON.CONFIRM')" :cancel-button-text="$t('COMMON.CANCEL')"
                        :title="$t('COMMON.EXPORT_CONFIRM')" @confirm="handleExport()">
                        <el-button slot="reference" type="border" size="medium">{{ $t('COMMON.EXPORT')
                        }}</el-button>
                    </el-popconfirm>
                </el-col>
            </el-row>

            <el-table :data="historyData">
                <el-table-column type="index" width="50" align="center"></el-table-column>
                <el-table-column prop="time" :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.TIMESTAMP')" min-width="200"
                    align="center">
                    <template slot-scope="scope">
                        <span>{{ transformTimestamp(scope.row.ts) }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="key" :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.ATTRIBUTE.ATTRIBUTE_IDENTIFIER')"
                    min-width="200" align="center">{{ this.attributeName }}</el-table-column>
                <el-table-column prop="value" :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.VALUE')" min-width="200"
                    align="center"></el-table-column>
                <template #empty>
                    <div>{{ $t('COMMON.TABLE_NO_DATA') }}</div>
                </template>
            </el-table>

            <div class="text-center py-3">
                <el-row type="flex" justify="center">
                    <el-col :span=8 style="display: inline-block;">

                        <el-button @click="pageChange(page - 1)" icon="el-icon-back" type="border"
                            style="width: 45px; border-color:#747474" :disabled="this.page === 1" size="small"></el-button>
                        <el-button @click="pageChange(page + 1)" icon="el-icon-right" type="border"
                            style="width: 45px; border-color:#747474" :disabled="this.dataCount !== this.pageSize"
                            size="small"></el-button>
                    </el-col>
                </el-row>
            </div>
        </div>
        
        <el-dialog
            class="el-dark-dialog el-dark-input"
            width="30%" append-to-body
            :title="$t('COMMON.EXPORT')"
            :visible.sync="exportVisible">

            <div class="text-center">
            <p>{{ downloadUrl ? downloadUrl.split('/').pop().toString() : $t('COMMON.GENERATE_WAIT') }}</p>
            <p v-if="!exporting">
                <a :href="downloadUrl">{{ $t('COMMON.DOWNLOAD') }}</a>
            </p>
            </div>

        </el-dialog>
    </el-dialog>
</template>

<script>
import { historyValueData, getSystemTime } from "@/api/device"
import { dateFormat } from "@/utils/tool.js";

export default {
    name: "DeviceHistory",
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
            historyData: [],
            positionShow: false,
            locationArray: [],
            choosedTimeRange: [],
            isCopy: false,
            pageSize: 10,
            page: 1,
            dataCount: 0,
            exporting: false,
            exportVisible: false,
            downloadUrl: "",
            systemTimeInterval: null,
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
        }
    },
    watch: {
        dialogVisible: {
            handler(newValue) {
                let now = Date.now();
                console.debug("DeviceHistory", this)
                if (newValue) {
                    this.choosedTimeRange = [
                        new Date(now - 1000 * 60 * 60),
                        new Date(now)
                    ]
                    Promise.resolve(this.refreshSystime()).then(() => {
                        this.getHistoryData(true, 0);
                    })
                }
            }
        },
    },
    mounted() {
    },
    methods: {
        // 获取属性历史数据
        getHistoryData(isInit=false, lastPage=0) {
            let startTime = new Date(this.choosedTimeRange[0]).getTime() * 1000;
            let endTime = new Date(this.choosedTimeRange[1]).getTime() * 1000;
            let now = Date.now();
            let firstDataTime = 0;
            let endDataTime = 0;
            if (lastPage) {
                if (lastPage > this.page) {
                    firstDataTime = this.historyData[0].ts
                } else if (lastPage < this.page) {
                    endDataTime = this.historyData[this.historyData.length - 1].ts
                }
            }


            // 初始化范围
            if (isInit) {
                // 如果时间有误差，修正时间
                if (this.systemTimeInterval) {
                    now = now + this.systemTimeInterval;
                    console.debug("修正时间", now, this.systemTimeInterval, Date.now())
                }
                startTime = new Date(now - 1000 * 60 * 60).getTime() * 1000;
                endTime = new Date(now).getTime() * 1000;
                console.debug("初始化时间范围", new Date(startTime / 1000), new Date(endTime / 1000))
                // 选择时间范围
            } else {
                if (this.systemTimeInterval) {
                    now = now + this.systemTimeInterval;
                }
                startTime = (new Date(this.choosedTimeRange[0]).getTime() + this.systemTimeInterval) * 1000;
                endTime = (new Date(this.choosedTimeRange[1]).getTime() + this.systemTimeInterval) * 1000;

                console.debug("自定义时间范围", new Date(startTime / 1000), new Date(endTime / 1000))
            }


            historyValueData({
                "device_id": this.device.id,
                "key": this.attributeName,
                "start_time": startTime,
                "end_time": endTime,
                "page": this.page,
                "page_records": this.pageSize,
                "first_data_time": firstDataTime,
                "end_data_time": endDataTime,
            }).then(({ data }) => {
                console.debug("====getHistoryData", data)
                if (data.code == 200) {
                    // this.historyData = data.data.data ? data.data.data : []
                    this.historyData = data.data ? data.data : []
                    this.dataCount = this.historyData.length
                }
                console.debug(this.historyData)
            })
        },
        handleClose() {
            this.dialogVisible = false;
            this.page = 1;
            this.pageSize = 10;
        },
        transformTimestamp(timestamp) {
            return dateFormat(timestamp)
        },
        pageChange(val) {
            let lastPage = this.page;
            this.page = val;
            this.getHistoryData(false, lastPage);
        },
        handleExport() {
            if (this.exporting) return
            this.exporting = true
            this.exportVisible = true

            
            let startTime = new Date(this.choosedTimeRange[0]).getTime() * 1000;
            let endTime = new Date(this.choosedTimeRange[1]).getTime() * 1000;
            historyValueData({
                "device_id": this.device.id,
                "key": this.attributeName,
                "start_time": startTime,
                "end_time": endTime,
                "page": this.page,
                "page_records": this.pageSize,
                "export_excel": true
            }).then(({ data }) => {
                console.debug("====handleExport", data)
                if (data.code == 200) {
                    this.downloadUrl = data.data ? data.data : ""
                }
            }).finally(() => {
                this.exporting = false
            })
        },
        refreshSystime() {
            getSystemTime()
                .then(({ data }) => {
                    console.debug("====getSystemTime", data)
                    if (data.code == 200) {
                        let now = Date.now();
                        this.systemTimeInterval = data.data.timestamp ? data.data.timestamp - now : null
                        console.debug(data.data.timestamp, now, this.systemTimeInterval, "====getHistoryData")
                    }
                })
        },
        handleRefresh() {
            let now = Date.now();
            this.choosedTimeRange = [
                new Date(now - 1000 * 60 * 60),
                new Date(now)
            ]
            this.getHistoryData()
        }
    }
}
</script>
<style lang="scss" scoped>
.el-form-item__content {
    margin-left: 100px;
}
</style>