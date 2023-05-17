<template>
    <div class="rounded card p-4">
        <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
            <el-col :span="12">
                <TableTitle>租户管理</TableTitle>
            </el-col>

            <el-col :span="12" class="px-2 text-right">
                <el-button size="medium" type="border" @click="handleShowAdd">新增租户</el-button>
            </el-col>
        </el-row>
        <!-- 表 start -->
        <el-form class="inline-edit">
            <el-table :data="tableData" v-loading="loading">
                <el-table-column label="编号" type="index" align="left" width="200"></el-table-column>
                <el-table-column label="姓名" align="left" width="auto" prop="name"></el-table-column>
                <el-table-column label="邮箱" align="left" width="auto" prop="email"></el-table-column>
                <el-table-column label="手机" align="left" width="auto" prop="mobile"></el-table-column>

                <el-table-column align="left" label="操作" width="300">
                    <template v-slot="scope">
                        <div style="text-align: left">
                            <el-button type="save" size="mini" @click="handleShowEdit(scope.row)">编辑</el-button>
                            <el-button style="margin-right:10px" type="border" size="mini">冻结</el-button>
                            <el-popconfirm :title="$t('SYSTEM_MANAGEMENT.TITLE4')" @confirm="handleDelete(scope.row)">
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
        }
    },
}
</script>