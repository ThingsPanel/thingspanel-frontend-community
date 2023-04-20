<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-08 15:22:33
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-08 15:30:45
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\product\firmware\index.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <div class="rounded card p-4 el-table-transparent el-dark-input">
        <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
            <el-col :span="12">
                <TableTitle>固件升级</TableTitle>
            </el-col>
            <el-col :span="12" class="px-2 text-right">
                <el-button size="medium" type="border" @click="handleCreate">添加升级包</el-button>
              </el-col>
        </el-row>
        <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
            <el-col :span="4">
                <el-select>
                    <el-option label="全部产品" value="all"></el-option>
                </el-select>
            </el-col>
            <el-col :span="4">
                <el-input placeholder="请输入升级包名称"></el-input>
            </el-col>
            <el-col :span="4">
                <el-button type="border">搜索</el-button>
            </el-col>
        </el-row>
        <!-- 表 start -->
        <el-form class="inline-edit">
            <el-table :data="tableData" v-loading="loading">

                <!-- 升级包名称-->
                <el-table-column label="升级包名称" prop="name" align="center">
                </el-table-column>

                <!-- 升级包版本号-->
                <el-table-column label="升级包版本号" prop="version" align="center">
                </el-table-column>

                <!-- 归属产品-->
                <el-table-column label="归属产品" prop="parent" align="center">
                </el-table-column>

                <!-- 模块名称-->
                <el-table-column label="模块名称" prop="model" align="center">
                </el-table-column>

                <!-- 描述-->
                <el-table-column label="描述" prop="describe" align="center">
                </el-table-column>

                <!-- 创建日期-->
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
                @current-change="getList"></el-pagination>
        </div>
        <!-- 分页 end -->

    </div>
</template>
  
<script>
import TableTitle from "@/components/common/TableTitle.vue"

export default {
    name: "FirmwareUpgrade",
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
        getList() {

        },
        handleCreate() {

        },
        viewTaskList(item) {

        },
        handleDelete(item) {

        },

    }
}
</script>
  
<style scoped></style>