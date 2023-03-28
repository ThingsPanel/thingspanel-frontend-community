<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-08 15:22:33
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-28 08:53:03
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
                <el-select v-model="params.product_id">
                    <el-option label="全部产品" value="all" key="all"></el-option>
                    <!-- 遍历产品列表 -->
                    <el-option v-for="item in productList" :key="item.id" :label="item.name" :value="item.id"></el-option>
                </el-select>
            </el-col>
            <el-col :span="4">
                <!-- 给el-input添加tooltip -->
                <el-tooltip effect="dark" content="请输入升级包名称" placement="top">
                    <el-input placeholder="请输入升级包名称" v-model="params.package_name"></el-input>
                </el-tooltip>
                <!-- <el-input placeholder="请输入升级包名称" v-model="params.package_name"></el-input> -->
            </el-col>
            <el-col :span="4">
                <el-button type="border" @click="getList">搜索</el-button>
            </el-col>
        </el-row>
        <!-- 表 start -->
        <el-form class="inline-edit">
            <el-table :data="tableData" v-loading="loading">

                <!-- 升级包名称-->
                <el-table-column label="升级包名称" prop="package_name" align="left"/>

                <!-- 升级包版本号-->
                <el-table-column label="升级包版本号" prop="package_version" align="center"/>

                <!-- 归属产品-->
                <el-table-column label="归属产品" prop="product_name" align="center">
                </el-table-column>

                <!-- 模块名称-->
                <el-table-column label="模块名称" prop="package_module" align="center">
                </el-table-column>

                <!-- 描述-->
                <el-table-column label="描述" prop="description" align="center">
                </el-table-column>

                <!-- 创建日期-->
                <el-table-column :label="$t('PRODUCT_MANAGEMENT.BATCH_LIST.CREATEDATE')" prop="created_at" align="center">
                    <template v-slot="scope">
                        {{ scope.row.created_at ? formatDate(scope.row.created_at) : "--" }}
                    </template>
                </el-table-column>

                <!-- 操作列-->
                <el-table-column align="center" :label="$t('PRODUCT_MANAGEMENT.BATCH_LIST.OPERATION')" width="240px">
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

        <add-package :visible.sync="addPackageDialogVisible" @submit="getList"></add-package>

    </div>
</template>
  
<script>
import TableTitle from "@/components/common/TableTitle.vue"
import AddPackage from "./AddPackage.vue";
import OTAAPI from "@/api/ota"
// 引入 ProductAPI
import ProductAPI from "@/api/product"
// 引入mixins中的common.js
import "@/core/mixins/common.js";

import { data } from "./data"
export default {
    name: "FirmwareUpgrade",
    components: { TableTitle, AddPackage },
    data() {
        return {
            tableData: [],
            loading: false,
            params: {
                package_name: "",
                current_page: 1,
                per_page: 10,
                total: 0,
                product_id: "all"
            },
            addPackageDialogVisible: false,
            productList: []
        }
    },
    mounted() {
        // 调用获取产品列表的方法
        this.getProductList();
        this.getList();
    },
    methods: {
        /**
         * @description: 获取产品列表
         * @return {*}
         */
        getProductList() {
            this.loading = true;
            ProductAPI.page({current_page: 1,per_page: 9999})
                .then(({ data: result }) => {
                    if (result.code === 200) {
                        this.productList = result.data?.data || [];
                    }
                })
                .finally(() => {
                    this.loading = false;
                })
        },
        /**
         * @description: 获取列表
         * @return {*}
         */        
        getList() {
            this.params.product_id = this.params.product_id === "all" ? "" : this.params.product_id;
            OTAAPI.list(this.params)
                .then(({ data: result }) => {
                    console.log(result);
                    if (result.code === 200) {
                        this.tableData = result.data?.data || [];
                        this.params.total = result.data.total;
                    }
                })
            this.tableData = data;
            console.log(this.tableData)
        },
        handleCreate() {
            this.addPackageDialogVisible = true;
        },
        viewTaskList(item) {
            this.$router.push( { name: "OTATask", query: { otaId: item.id, productId: item.product_id } })
        },
        handleDelete(item) {
            OTAAPI.delete({id: item.id})
                .then(({ data: result }) => {
                    if (result.code === 200) {
                        this.$message.success("删除成功");
                        this.getList();
                    }
                })
        },

    }
}
</script>
  
<style scoped></style>