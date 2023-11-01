<template>
    <div>
        <el-row style="margin-bottom: 10px;">
            <el-col>
                <el-button type="border" size="medium" @click="showDialog">{{
                    $t('DEVICE_MANAGEMENT.DEVICE_CONFIG.ATTRIBUTE.DELIVERY_ATTRIBUTE') }}</el-button>
            </el-col>
        </el-row>

        <el-row>
            <el-table style="width: 100%;" :data="attributeList" v-loading="attributeLoading">
                <el-table-column prop="key" :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.ATTRIBUTE.ATTRIBUTE_IDENTIFIER')"
                    min-width="90" align="center"></el-table-column>
                <el-table-column prop="name" :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.ATTRIBUTE.ATTRIBUTE_NAME')"
                    min-width="80" align="center"></el-table-column>
                <el-table-column prop="str_v" :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.ATTRIBUTE.ATTRIBUTE_VALUE')"
                    min-width="80" align="center" v-slot="scope">
                    {{ scope.row.str_v ? scope.row.str_v : scope.row.dbl_v }}
                </el-table-column>
                <el-table-column prop="ts" :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.ATTRIBUTE.UPDATE_TIME')"
                    min-width="100" align="center" v-slot="scope">
                    {{ transformTimestamp(scope.row.ts) }}
                </el-table-column>
                <el-table-column prop="value" :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.ATTRIBUTE.HISTORY_DATA')"
                    min-width="50" align="center" v-slot="scope">
                    <i @click="showDeviceHistory(scope.row.key)" style="padding: 3px 5px; cursor:pointer;"
                        class="el-icon-notebook-2"></i>
                </el-table-column>
                <el-table-column prop="value" :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.ATTRIBUTE.CHART_ANALYSIS')"
                    min-width="50" align="center" v-slot="scope">
                    <i v-if="isShowDataChart(scope.row)" @click="showDeviceDataChart(scope.row.key)"
                        style="padding: 3px 5px; cursor:pointer;" class="el-icon-pie-chart"></i>
                    <i v-else style="padding: 3px 5px; cursor:not-allowed;" class="el-icon-pie-chart"></i>
                </el-table-column>
                <el-table-column prop="value" :label="$t('COMMON.OPERATION')" min-width="50" align="center" v-slot="scope">
                    <el-popconfirm :confirm-button-text="$t('COMMON.CONFIRM')" :cancel-button-text="$t('COMMON.CANCEL')"
                        :title="$t('COMMON.DELETE_CONFIRM')" @confirm="deleteHistoryData(scope.row.key)">
                        <el-button slot="reference" size="mini" type="border">
                            {{ $t('DEVICE_MANAGEMENT.DEVICE_CONFIG.ATTRIBUTE.DELETE_HISTORY_DATA') }}
                        </el-button>
                    </el-popconfirm>
                </el-table-column>
                <template #empty>
                    <div>{{ $t('COMMON.TABLE_NO_DATA') }}</div>
                </template>
            </el-table>
        </el-row>

        <!-- 属性下发 -->
        <el-dialog class="el-dark-dialog el-dark-input dialog-css"
            :title="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.ATTRIBUTE.DELIVERY_ATTRIBUTE')" width="30%"
            :close-on-press-escape="false" show-close append-to-body :visible.sync="dialogVisible" @close="handleClose">

            <div>
                <h3>{{ $t('DEVICE_MANAGEMENT.DEVICE_CONFIG.ATTRIBUTE.ATTRIBUTE_JSON_OBJECT') }}</h3>
            </div>

            <CodeEditor v-model="deliveryAttribute" class="dark-code-editor" key="upside"
                style="width: 100%;height: 260px;overflow-y: auto" min_height="260px" :copy_code="true" :hide_header="false"
                theme="dark" :wrap_code="true"></CodeEditor>

            <span slot="footer" class="dialog-footer">
                <el-button type="cancel" @click="handleClose">{{ $t('DEVICE_MANAGEMENT.DEVICE_CONFIG.CANCEL') }}</el-button>
                <el-button type="save" @click="handleSubmit">{{ $t('DEVICE_MANAGEMENT.DEVICE_CONFIG.CONFIRM') }}</el-button>
            </span>
        </el-dialog>

        <!-- 属性历史数据 -->
        <DeviceHistory :visible.sync="deviceHistoryVisible" :device="device" :attributeName="attributeName"></DeviceHistory>
        <!-- 属性时序图表 -->
        <DeviceDataChart :visible.sync="deviceDataChartVisible" :device="device" :attributeName="attributeName">
        </DeviceDataChart>

    </div>
</template>

<script>
import CodeEditor from 'simple-code-editor';
import { currentValueDetail, delHistoryData, turnSwitch } from "@/api/device"
import { dateFormat } from "@/utils/tool.js";
import DeviceHistory from "./DeviceHistory.vue"
import DeviceDataChart from "./DeviceDataChart.vue"
import { message_error, message_success } from "@/utils/helpers";
import i18n from "@/core/plugins/vue-i18n.js"

export default {
    name: "Attribute",
    components: {
        CodeEditor,
        DeviceHistory,
        DeviceDataChart,
    },
    props: {
        // data: {
        //     type: Object,
        //     default: () => {
        //         return {}
        //     }
        // },
        device: {
            type: [Object],
            default: () => { return {} }
        },
    },
    data() {
        return {
            dialogVisible: false,
            deviceHistoryVisible: false,
            deviceDataChartVisible: false,
            attributeName: "",
            deliveryAttribute: "",
            attributeList: [],
            tableData: [],
            attributeLoading: false,
        }
    },
    computed: {
    },
    watch: {
    },
    mounted() {
        this.getAttributeList();
    },
    methods: {
        // 获取属性数据
        getAttributeList() {
            this.attributeLoading = true;
            currentValueDetail({ "device_id": this.device.id })
                .then(({ data }) => {
                    if (data.code == 200) {
                        let list = data.data ? data.data : [];
                        this.attributeList = list.filter(currentValue => currentValue.key !== "systime" && currentValue.key !== "SYS_ONLINE")
                    }
                }).finally(() => {
                    this.attributeLoading = false;
                })
        },
        handleClose() {
            this.dialogVisible = false;
            this.deliveryAttribute = ""
        },
        showDialog() {
            this.dialogVisible = true;
        },
        transformTimestamp(timestamp) {
            return dateFormat(timestamp)
        },
        showDeviceHistory(attributeName) {
            this.deviceHistoryVisible = true;
            this.attributeName = attributeName
        },
        showDeviceDataChart(attributeName) {
            this.deviceDataChartVisible = true;
            this.attributeName = attributeName
        },
        deleteHistoryData(attributeName) {
            this.attributeLoading = true;
            delHistoryData({ "device_id": this.device.id, "attribute": attributeName })
                .then(({ data }) => {
                    if (data.code === 200) {
                        message_success(i18n.t("COMMON.DELETE_SUCCESS"))
                    } else {
                        message_error(i18n.t("COMMON.DELETE_FAILED"))
                    }

                    this.getAttributeList()

                })
        },
        handleSubmit() {
            let values;
            try {
                values = JSON.parse(this.deliveryAttribute)
            } catch (error) {
                values = {}
            }
            console.debug("handleSubmit", values)
            turnSwitch({ "device_id": this.device.id, values })
                .then(({ data }) => {

                    if (data.code === 200) {
                        message_success(i18n.t("COMMON.EDIT_SUCCESS"))
                    } else {
                        message_error(i18n.t("COMMON.EDIT_FAILED"))
                    }
                })
        },
        isShowDataChart(item) {
            if (!item) {
                return false
            }
            let value = item.str_v ? item.str_v : item.dbl_v
            if (!value || typeof value === "number") {
                return true
            }
            return false
        },
    }
}
</script>
<style lang="scss" scoped>
.el-form-item__content {
    margin-left: 100px;
}
</style>