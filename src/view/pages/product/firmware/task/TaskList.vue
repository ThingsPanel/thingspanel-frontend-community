<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-08 15:22:33
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-15 11:21:45
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\product\firmware\index.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <div class="rounded card p-4 el-table-transparent el-dark-input">
        <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
            <el-col :span="12" :offset="12" class="px-2 text-right">
                <el-button size="medium" type="border" @click="handleCreate">添加升级任务</el-button>
              </el-col>
        </el-row>
        
        <!-- 表 start -->
        <el-form class="inline-edit">
            <el-table :data="tableData" v-loading="loading">

                <!-- 任务名称-->
                <el-table-column label="任务名称" prop="name" align="center"/>

                <!-- 状态-->
                <el-table-column label="状态" prop="status" align="center"/>

                <!-- 设备数量-->
                <el-table-column label="设备数量" prop="number" align="center">
                </el-table-column>

              
                <!-- 创建时间-->
                <el-table-column :label="$t('PRODUCT_MANAGEMENT.BATCH_LIST.CREATEDATE')" prop="created" align="center">
                    <template v-slot="scope">
                        {{ scope.row.created ? scope.row.created : "--" }}
                    </template>
                </el-table-column>

                <!-- 操作列-->
                <el-table-column align="left" :label="$t('PRODUCT_MANAGEMENT.BATCH_LIST.OPERATION')" width="540px">
                    <template v-slot="scope">
                        <div class="text-center">
                            <el-button type="indigo" class="mr-1" size="mini" @click="viewTaskList(scope.row)">查看</el-button>
                            <el-button type="indigo" class="mr-1" size="mini" @click="cancelTask(scope.row)">取消</el-button>
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
                @current-change="getList"></el-pagination>
        </div>
        <!-- 分页 end -->

        <!-- <add-package :visible.sync="addPackageDialogVisible"></add-package> -->
        <add-task :visible.sync="addTaskDialogVisible"></add-task>

    </div>
</template>
  
<script>
import AddTask from "./AddTask.vue"
import { data } from "./data"
export default {
    name: "TaskList",
    components: { AddTask },
    data() {
        return {
            tableData: [],
            loading: false,
            params: {
                category: "all",
                current_page: 1,
                per_page: 10,
                total: 0
            },
            addTaskDialogVisible: false
        }
    },
    mounted() {
        this.getList();
    },
    methods: {
        /**
         * @description: 获取列表
         * @return {*}
         */        
        getList() {
            this.tableData = data;
            console.log(this.tableData)
        },
        handleCreate() {
            this.addTaskDialogVisible = true;
        },
        viewTaskList(row) {
            this.$router.push({ name: "TaskDetail" })
        },
        cancelTask(row) {

        }
    }
}
</script>
  
<style scoped></style>