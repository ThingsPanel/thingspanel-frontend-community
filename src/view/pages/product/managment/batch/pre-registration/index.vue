<template>
    <div class="rounded card p-4 el-table-transparent el-dark-input">
        <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
            <el-col :span="12">
                <TableTitle>预注册管理</TableTitle>
            </el-col>

        </el-row>
        <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
            <el-col :span="4">
                <el-select>
                    <el-option label="全部" value="all"></el-option>
                </el-select>
            </el-col>
            <el-col :span="4">
                <el-input placeholder="请输入设备编号"></el-input>
            </el-col>
            <el-col :span="4">
                <el-button type="border">搜索</el-button>
            </el-col>
        </el-row>
        <!-- 表 start -->
        <el-form class="inline-edit">
            <el-table :data="tableData" v-loading="loading">

                <!-- 批号-->
                <el-table-column label="设备编号" prop="batch_number" align="center">
                </el-table-column>

                <!-- 设备数量-->
                <el-table-column label="激活状态" prop="device_number" align="center">
                </el-table-column>


                <!-- 激活日期-->
                <el-table-column :label="$t('PRODUCT_MANAGEMENT.BATCH_LIST.CREATEDATE')" prop="created" align="center">
                    <template v-slot="scope">
                        {{ scope.row.created ? scope.row.created : "--" }}
                    </template>
                </el-table-column>

                <!-- 操作列-->
                <el-table-column align="left" :label="$t('PRODUCT_MANAGEMENT.BATCH_LIST.OPERATION')" width="540px">
                    <template v-slot="scope">
                        <div class="text-center">
                            
                            <el-popconfirm class="mr-1" :title="$t('AUTOMATION.TITLE4')" @confirm="handleDelete(scope.row)">
                                <el-button slot="reference" style="margin-left:10px" size="mini" type="danger">{{
                                    $t('PRODUCT_MANAGEMENT.BATCH_LIST.DELETE') }}</el-button>
                            </el-popconfirm>
                        </div>
                    </template>
                </el-table-column>
            </el-table>
        </el-form>
        <!-- 表 end -->

        <!-- 分页 start -->
        <div class="text-right py-3">
            <el-pagination background layout="prev, pager, next" :total="params.total"
                :current-page.sync="params.current_page" :page-size="params.per_page"
                @current-change="getPreRegistrationList"></el-pagination>
        </div>
        <!-- 分页 end -->

    </div>
</template>
  
<script>
import TableTitle from "@/components/common/TableTitle.vue"

export default {
    name: "PreRegistration",
    components: { TableTitle },
    data() {
        return {
            tableData: [],
            loading: false,
            params: {
                current_page: 1,
                per_page: 10,
                total: 0
            }
        }
    },
    methods: {
        getPreRegistrationList() {

        },
        handleDelete(item) {

        },

    }
}
</script>
  
<style scoped></style>