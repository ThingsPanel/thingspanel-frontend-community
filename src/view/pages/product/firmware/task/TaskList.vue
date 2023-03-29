<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-08 15:22:33
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-29 12:02:06
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
                <el-table-column label="任务名称" prop="task_name" align="left"/>

                <!-- 状态-->
                <el-table-column label="状态" prop="task_status" align="center">
                    <template v-slot="scope">
                        {{ getUpgradeStatus(scope.row.task_status) }}
                    </template>
                </el-table-column>

                <!-- 设备数量-->
                <el-table-column label="设备数量" prop="device_count" align="center">
                </el-table-column>

              
                <!-- 创建时间-->
                <el-table-column :label="$t('PRODUCT_MANAGEMENT.BATCH_LIST.CREATEDATE')" prop="created_at" align="center">
                    <template v-slot="scope">
                        {{ scope.row.created_at ? formatDate(scope.row.created_at) : "--" }}
                    </template>
                </el-table-column>

                <!-- 操作列-->
                <el-table-column align="right" :label="$t('PRODUCT_MANAGEMENT.BATCH_LIST.OPERATION')" width="240px">
                    <template v-slot="scope">
                        <div class="text-right">
                            <el-button type="indigo" class="mr-1" size="mini" @click="viewTaskList(scope.row)">查看</el-button>
                            
                            <el-popconfirm title="确定要取消升级吗？" @confirm="cancelTask(scope.row)">
                                <el-button slot="reference" type="danger" 
                                    v-loading="!!scope.row.isLoading" class="mr-1" size="mini">取消</el-button>
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
                @current-change="getList"></el-pagination>
        </div>
        <!-- 分页 end -->

        <add-task :visible.sync="addTaskDialogVisible" :data="data" @submit="getList"></add-task>

    </div>
</template>
  
<script>
import AddTask from "./AddTask.vue"
import OTAAPI from "@/api/ota"
import "@/core/mixins/common"
// 引入Const里的升级状态
import { UpgradeState } from "./Const"
export default {
    name: "TaskList",
    components: { AddTask },
    props: {
        id: {
            type: [String],
            default: ""
        },
        data: {
            type: [Object],
            default: () => { return {}}
        }
    },
    data() {
        return {
            tableData: [],
            loading: false,
            params: {
                current_page: 1,
                per_page: 10,
                total: 0
            },
            addTaskDialogVisible: false,
            upgradeState: UpgradeState
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
            this.params.ota_id = this.$route.query.otaId;
            this.loading = true;
            console.log("taskList", this.params)
            OTAAPI.taskList(this.params)
                .then(({ data: result }) => {
                    if (result.code === 200) {
                        this.tableData = result.data?.data || [];
                        this.params.total = result.data?.total || 0;
                    }
                })
                .finally(() => {
                    this.loading = false;
                })
        },
        /**
         * @description: 添加任务
         * @return {*}
         */
        handleCreate() {
            this.addTaskDialogVisible = true;
        },
        /**
         * @description: 查看任务详情
         * @param {*} row
         * @return {*}
         */
        viewTaskList(row) {
            this.$router.push({ name: "TaskDetail", query: { taskId: row.id } })
        },
        /**
         * @description: 取消任务
         * @param {*} row
         * @return {*}
         */
        cancelTask(row) {
            row.isLoading = true;
            OTAAPI.modifyUpgradeStatus({ ota_task_id: row.id })
                .then(({ data: result}) => {
                    if (result.code === 200) {
                        this.getList();
                    }
                })
        },
        getUpgradeStatus(status) {
            switch (status) {
                case "0": {
                    return "待升级";
                }
                case "1": {
                    return "升级中";
                }
                case "2": {
                    return "已完成";
                }
            }
            return "待升级";
        }
    }
}
</script>
  
<style scoped></style>