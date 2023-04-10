<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-04-07 17:30:55
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-04-07 17:55:02
 * @FilePath: \ThingsPanel-Vue-Tenant\src\view\pages\system\tenant\index.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <div class="rounded card p-4">
        <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
            <el-col :span="12">
                <TableTitle>租户管理</TableTitle>
            </el-col>

            <el-col :span="12" class="px-2 text-right">
                <el-button size="medium" type="border" @click="handleAddTenant">新增租户</el-button>
            </el-col>
        </el-row>
        <!-- 表 start -->
        <el-form class="inline-edit">
            <el-table :data="tableData" v-loading="loading">
                <el-table-column label="编号" type="index" align="left" width="200"></el-table-column>
                <el-table-column label="用户名" align="left" width="auto"></el-table-column>
                <el-table-column label="姓名" align="left" width="auto"></el-table-column>
                <el-table-column label="邮箱" align="left" width="auto"></el-table-column>
                <el-table-column label="手机" align="left" width="auto"></el-table-column>


                <el-table-column align="left" label="操作" width="300">
                    <template v-slot="scope">
                        <div style="text-align: left">
                            <el-button type="save" size="mini">编辑</el-button>
                            <el-button type="cancel" size="mini">删除</el-button>
                        </div>
                    </template>
                </el-table-column>
            </el-table>
        </el-form>
        <!-- 表 end -->

        <div class="text-right py-3">
            <el-pagination background layout="prev, pager, next" :total="total" :current-page.sync="params.current_page"
                :page-size="params.per_page" @current-change="getList"></el-pagination>
        </div>

        <add-tenant :visible.sync="visible"></add-tenant>

    </div>
</template>

<script>
import TableTitle  from "@/components/common/TableTitle.vue";
import AddTenant from './AddTenant'
export default {
    name: "Tenant",
    components: {TableTitle, AddTenant},
    data() {
        return {
           tableData: [],
           loading: false,
           params: {
            current_page: 1,
            per_page: 10,
           },
           tenantDialog: false
        }
    },
    methods: {
        getList() {
            this.loading = true;
            
        },
        handleAddTenant() {
            this.tenantDialog = true;
        }
    },
}
</script>