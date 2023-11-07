<template>
    <div class="rounded card p-4">
        <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
            <el-col :span="12">
                <TableTitle>{{ $t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.TENANT_MANAGEMENT') }}</TableTitle>
            </el-col>

            <el-col :span="12" class="px-2 text-right">
                <el-button size="medium" type="border" @click="handleShowAdd">{{ $t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.ADD_TENANT') }}</el-button>
            </el-col>
        </el-row>
        <!-- 表 start -->
        <el-form class="inline-edit">
            <el-table :data="tableData" v-loading="loading">
                <el-table-column :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.NO')" type="index" align="left" width="200"></el-table-column>
                <el-table-column :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.NAME')" align="left" width="auto" prop="name"></el-table-column>
                <el-table-column :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.TELEPHONE')" align="left" width="auto" prop="mobile"></el-table-column>
                <el-table-column :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.EMAIL')" align="left" width="auto" prop="email"></el-table-column>
                <el-table-column prop="created_at" :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.CREATED_TIME')">
                    <template v-slot="scope">
                    {{ scope.row.created_at ? dateFormat(scope.row.created_at) : "" }}
                    </template>
                </el-table-column>
                <el-table-column align="left" :label="$t('COMMON.OPERATION')" width="300">
                    <template v-slot="scope">
                        <div style="text-align: left">
                            <el-button type="save" size="mini" @click="handleShowEdit(scope.row)">{{ $t('COMMON.EDIT') }}</el-button>
                            <el-button style="margin-right:10px" type="border" size="mini">{{ $t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.FREEZE') }}</el-button>
                            <el-popconfirm :confirm-button-text="$t('COMMON.CONFIRM')" :cancel-button-text="$t('COMMON.CANCEL')" :title="$t('SYSTEM_MANAGEMENT.TITLE4')" @confirm="handleDelete(scope.row)">
                                <el-button slot="reference" type="danger" size="mini">{{ $t('SYSTEM_MANAGEMENT.DELETE') }}</el-button>
                            </el-popconfirm>
                        </div>
                    </template>
                </el-table-column>
            </el-table>
        </el-form>
        <!-- 表 end -->

        <div class="text-right py-3">
            <el-pagination background layout="prev, pager, next" :total="total" :current-page.sync="params.page"
                :page-size="params.limit" @current-change="getList"></el-pagination>
        </div>

        <EditTenant :visible.sync="tenantDialogVisible" :data="currentItem" @submit="getList"></EditTenant>

    </div>
</template>

<script>
import TableTitle  from "@/components/common/TableTitle.vue";
import EditTenant from './EditTenant.vue'
import { user_index, user_delete } from "@/api/user.js"
import { message_success } from '@/utils/helpers';
export default {
    name: "TenantIndex",
    components: {TableTitle, EditTenant},
    data() {
        return {
           tableData: [],
           loading: false,
           total: 0,
           params: {
            current_page: 1,
            limit: 10,
           },
           tenantDialogVisible: false,
           currentItem: {}
        }
    },
    mounted() {
        this.getList();
    },
    methods: {
        getList() {
            this.loading = true;
            this.params.enabled = 1;
            user_index(this.params)
                .then(({data: result}) => {
                    if (result.code === 200) {
                        this.tableData = result.data.data;
                        this.total = result.data.total;
                    }
                })
                .finally(() => {
                    this.loading = false;
                })
        },
        handleShowAdd() {
            this.currentItem = {};
            this.tenantDialogVisible = true;
        },
        handleShowEdit(row) {
            console.log('handleAddTenant', row)
            this.currentItem = { ...row };
            this.tenantDialogVisible = true;
        },
        handleDelete(row) {
            user_delete({id: row.id})
                .then(({data})=>{
                    if(data.code === 200){
                        message_success("删除成功");
                        this.getList();
                    }
                })
        },
        
        dateFormat(timestamp) {
            if (!timestamp) return "";
            if (timestamp.toString().length === 10) {
                timestamp = Number(timestamp) * 1000;
            } else if (timestamp.toString().length === 13) {
                timestamp = timestamp;
            } else if (timestamp.toString().length === 16) {
                timestamp = timestamp.toString().substring(0, 13);
            } else {
                return "";
            }
            var n = parseInt(timestamp);
            var D = new Date(n);
            var year = D.getFullYear(); //四位数年份

            var month = D.getMonth() + 1; //月份(0-11),0为一月份
            month = month < 10 ? "0" + month : month;

            var day = D.getDate(); //月的某一天(1-31)
            day = day < 10 ? "0" + day : day;

            var hours = D.getHours(); //小时(0-23)
            hours = hours < 10 ? "0" + hours : hours;

            var minutes = D.getMinutes(); //分钟(0-59)
            minutes = minutes < 10 ? "0" + minutes : minutes;

            var seconds = D.getSeconds(); //秒(0-59)
            seconds = seconds < 10 ? "0" + seconds : seconds;
            // var week = D.getDay();//周几(0-6),0为周日
            // var weekArr = ['周日','周一','周二','周三','周四','周五','周六'];

            var now_time =
                year +
                "-" +
                month +
                "-" +
                day +
                " " +
                hours +
                ":" +
                minutes +
                ":" +
                seconds;
            return now_time;
        }
    },
}
</script>