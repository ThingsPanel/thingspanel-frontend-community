<template>
    <div style="width: 100%;">
        <el-row type="flex" :gutter="10" class="pt-3 pb-4 px-3 el-dark-input">
            <el-col :span="5">
                <el-select v-model="params.operation_type" size="medium"
                    :placeholder="$t('SYSTEM_LOG.DEVICE_LOG.OPERATIONTYPE')" clearable>
                    <el-option :label="$t('SYSTEM_LOG.DEVICE_LOG.TIMINGTRIGGER')" value="1"></el-option>
                    <el-option :label="$t('SYSTEM_LOG.DEVICE_LOG.MANUALCONTROL')" value="2"></el-option>
                    <el-option :label="$t('SYSTEM_LOG.DEVICE_LOG.AUTOMATICCONTROL')" value="3"></el-option>
                </el-select>
            </el-col>
            <el-col :span="6">
                <el-select v-model="params.send_result" :placeholder="$t('SYSTEM_LOG.DEVICE_LOG.SELECTSENDRESULTS')"
                    clearable size="medium">
                    <el-option :label="$t('SYSTEM_LOG.DEVICE_LOG.SUCCESSFUL')" value="1"></el-option>
                    <el-option :label="$t('SYSTEM_LOG.DEVICE_LOG.FAILURE')" value="2"></el-option>
                </el-select>
            </el-col>
            <el-col :span="14">
                <el-button type="border" size="medium" @click="handleSearch()" class="butStyle">{{
                    $t("SYSTEM_LOG.DEVICE_LOG.SEARCH") }}</el-button>
                <el-button type="default" size="medium" @click="handleReset()" class="butStyle">{{
                    $t("SYSTEM_LOG.DEVICE_LOG.RESET") }}</el-button>
            </el-col>
        </el-row>
        <!-- 头 end -->

        <!-- 表 start -->
        <el-table :data="tableData" v-loading="logLoading">
            <el-table-column :label="$t('SYSTEM_LOG.DEVICE_LOG.NUMBERID')" type="index" width="50" align="left">
                <template v-slot="scope">
                    <span>{{ (params.page - 1) * 10 + scope.$index + 1 }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('SYSTEM_LOG.DEVICE_LOG.BUSINESSNAME1')" width="150" align="left"
                prop="business_name">
                <template v-slot="scope">
                    <span class="cursor-pointer" @click="handleSearch({ business_name: scope.row.business_name })">{{
                        scope.row.business_name }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('SYSTEM_LOG.DEVICE_LOG.DEVICENAME1')" prop="device_name" width="140">
                <template v-slot="scope">
                    {{ scope.row.device_name }}
                </template>
            </el-table-column>

            <el-table-column :label="$t('SYSTEM_LOG.DEVICE_LOG.DWVICEGROUPNAME1')" prop="asset_name" width="150">
                <template v-slot="scope">
                    <span class="cursor-pointer" @click="handleSearch({ asset_name: scope.row.asset_name })">{{
                        scope.row.asset_name
                    }}</span>
                </template>
            </el-table-column>

            <el-table-column :label="$t('SYSTEM_LOG.DEVICE_LOG.INSTRUCTION1')" prop="instruct">
                <template v-slot="scope">
                    {{ scope.row.instruct }}
                </template>
            </el-table-column>
            <el-table-column :label="$t('SYSTEM_LOG.DEVICE_LOG.OPERATIONTYPE1')" prop="operation_type" width="90">
                <template v-slot="scope">
                    <el-tag class="tag-operation-type" v-if="scope.row.operation_type == '1'">{{
                        $t("SYSTEM_LOG.DEVICE_LOG.TIMINGTRIGGER") }}</el-tag>
                    <el-tag class="tag-operation-type" v-if="scope.row.operation_type == '2'">{{
                        $t("SYSTEM_LOG.DEVICE_LOG.MANUALCONTROL") }}</el-tag>
                    <el-tag class="tag-operation-type" v-if="scope.row.operation_type == '3'">{{
                        $t("SYSTEM_LOG.DEVICE_LOG.AUTOMATICCONTROL") }}</el-tag>
                    <!--           <p class="green" v-if="scope.row.operation_type == '1'"><span>{{"定时触发"}}</span></p>-->
                    <!--           <p class="green" v-if="scope.row.operation_type == '2'"><span>{{"手动控制"}}</span></p>-->
                    <!--           <p class="green" v-if="scope.row.operation_type == '3'"><span>{{"自动控制"}}</span></p>-->
                </template>
            </el-table-column>
            <el-table-column :label="$t('SYSTEM_LOG.DEVICE_LOG.OPERATE_USER')" prop="operation_type" width="90">
                <template v-slot="scope">
                    <el-tooltip class="item" effect="dark" :content="scope.row.user_name" placement="top-start">
                        <span>{{
                            scope.row.user_name ? scope.row.user_name.length > 10 ? scope.row.user_name.substr(0, 5) + "..." : scope.row.user_name : ""
                        }}</span>
                    </el-tooltip>
                </template>
            </el-table-column>
            <el-table-column :label="$t('SYSTEM_LOG.DEVICE_LOG.TRIGGERINGTIME1')" prop="cteate_time"
                width="90"></el-table-column>
            <!-- <el-table-column :label='$t("COMMON.BUSINESS")' ></el-table-column> -->
            <!-- <div class="text-title">{{ $t("COMMON.BUSINESS") }}：</div> -->
            <el-table-column :label="$t('SYSTEM_LOG.DEVICE_LOG.SENDTHERESULIT1')" prop="send_result" align="center"
                width="80">
                <template v-slot="scope">
                    <el-tag class="tag-success" v-if="scope.row.send_result == '1'">{{
                        $t("SYSTEM_LOG.DEVICE_LOG.SUCCESSFUL")
                    }}</el-tag>
                    <el-tag class="tag-failed" v-else>{{
                        $t("SYSTEM_LOG.DEVICE_LOG.FAILURE")
                    }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column :label="$t('SYSTEM_LOG.DEVICE_LOG.PROTOCOLTYPE1')" prop="protocol_type" align="center"
                width="80"></el-table-column>

            <template #empty>
                <div>{{ $t('COMMON.TABLE_NO_DATA') }}</div>
            </template>
        </el-table>
        <!-- 表 end -->

        <div class="text-right py-3">
            <el-pagination background layout="prev, pager, next" :total="logTotal" :current-page.sync="params.page"
                :page-size="params.limit" @current-change="getOperationIndex"></el-pagination>
        </div>
    </div>
</template>

<script>
import ApiService from "@/core/services/api.service";

export default {
    name: "DevicePlugin",
    components: {
    },
    props: {
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
    },
    data() {
        return {
            tableData: [],
            attributeLoading: false,
            logLoading: false,
            logTotal: 0,
            params: {
                device_id: this.device.id,
                business_name: "",
                per_page: 10,
                current_page: 1,
                asset_name: "",
                operation_type: "",
                send_result: "",
            },
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
        }
    },
    watch: {
    },
    mounted() {
        this.queryValue();
    },
    methods: {
        // 数据查询 /api/conditions/log/index
        queryValue() {
            this.logLoading = true;
            const local_url = process.env.VUE_APP_BASE_URL || document.location.origin + "/";
            ApiService.post(local_url + "api/conditions/log/index", this.params)
                .then(({ data }) => {
                    if (data.code == 200) {
                        this.tableData = data.data.data;
                        this.logTotal = data.data.total;
                        this.logLoading = false;
                    }
                })
                .finally(() => {
                    this.logLoading = false;
                });
        },
        handleSearch(filter) {
            // 有传参的时候才赋值查询
            if (filter) {
                if ("business_name" in filter && is_string(filter.business_name)) {
                    this.params.business_name = filter.business_name;
                }
                if ("asset_name" in filter && is_string(filter.asset_name)) {
                    this.params.asset_name = filter.asset_name;
                }
                if ("operation_type" in filter && is_string(filter.operation_type)) {
                    this.params.operation_type = filter.operation_type;
                }
                if ("send_result" in filter && is_string(filter.send_result)) {
                    this.params.send_result = filter.send_result;
                }
            }

            this.params.current_page = 1;
            this.queryValue();
        },
        getOperationIndex(page) {
            this.logLoading = true;
            this.params.current_page = page;
            this.queryValue();
        },
        handleReset() {
            this.params = {
                device_id: this.device.id,
                business_name: "",
                per_page: 10,
                current_page: 1,
                asset_name: "",
                operation_type: "",
                send_result: "",
            }
            this.queryValue();
        },
    }
}
</script>
<style lang="scss" scoped></style>