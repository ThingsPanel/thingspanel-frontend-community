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
                    <el-button type="border" size="medium" @click="getHistoryData()">{{
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
                    <el-col :span=2 style="display: inline-block;">

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
import { historyValueData } from "@/api/device"
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
            choosedTimeRange: [
                new Date(now - 1000 * 60 * 60),
                new Date(now)
            ],
            isCopy: false,
            pageSize: 10,
            page: 1,
            dataCount: 0,
            exporting: false,
            exportVisible: false,
            downloadUrl: "",
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
                console.debug("DeviceHistory", this)
                if (newValue) {
                    const now = Date.now();
                    this.getHistoryData()
                }
            }
        },
    },
    mounted() {
    },
    methods: {
        // 获取属性历史数据
        getHistoryData(page, pageSize) {
            let startTime = new Date(this.choosedTimeRange[0]).getTime() * 1000;
            let endTime = new Date(this.choosedTimeRange[1]).getTime() * 1000;
            historyValueData({
                "device_id": this.device.id,
                "key": this.attributeName,
                "start_time": startTime,
                "end_time": endTime,
                "page": page ? page : this.page,
                "page_records": pageSize ? pageSize : this.pageSize
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
            this.page = val;
            this.getHistoryData();
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
        }
    }
}
</script>
<style lang="scss" scoped>
.el-form-item__content {
    margin-left: 100px;
}
</style>