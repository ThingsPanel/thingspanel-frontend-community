<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-08 14:05:48
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-28 15:21:03
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\product\managment\batch\pre-registration\index.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <div class="rounded card p-4 el-table-transparent el-dark-input">
        <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
            <el-col :span="12">
                <TableTitle>{{ params.productName + ' - ' + params.batchNumber}} - 预注册管理</TableTitle>
            </el-col>

        </el-row>
        <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
            <el-col :span="4">
                <el-select v-model="params.add_flag">
                    <el-option label="全部" value="all"></el-option>
                    <el-option label="已添加" value="1"></el-option>
                    <el-option label="未添加" value="0"></el-option>
                </el-select>
            </el-col>
            <el-col :span="4">
                <el-input placeholder="请输入设备编号" v-model="params.device_number"></el-input>
            </el-col>
            <el-col :span="4">
                <el-button type="border" @click="getPreRegistrationList">搜索</el-button>
            </el-col>
        </el-row>
        <!-- 表 start -->
        <el-form class="inline-edit">
            <el-table :data="tableData" v-loading="loading">

                <!-- 批号-->
                <el-table-column label="设备编号" prop="device_code" align="left"/>

                <!-- 添加状态 -->
                <el-table-column label="添加状态" prop="add_flag" align="left">
                    <template v-slot="scope">
                        {{ scope.row.add_flag === '1' ? "已添加" : "未添加" }}  
                    </template>
                </el-table-column>

                <!-- 添加日期 -->
                <el-table-column label="添加日期" prop="add_date" align="center">
                </el-table-column>
                

                <!-- 激活状态-->
                <el-table-column label="激活状态" prop="activate_flag" align="center">
                    <template v-slot="scope">
                        {{ scope.row.activate_flag === '1' ? "已激活" : "未激活" }}
                    </template>
                </el-table-column>


                <!-- 激活日期-->
                <!-- <el-table-column label="激活日期" prop="created" align="center">
                    <template v-slot="scope">
                        {{ scope.row.created_time ? formatDate(scope.row.created_time) : "--" }}
                    </template>
                </el-table-column> -->

                <!-- 操作列-->
                <el-table-column align="right" :label="$t('PRODUCT_MANAGEMENT.BATCH_LIST.OPERATION')" width="180px">
                    <template v-slot="scope">
                        <div class="text-right">
                            <el-button slot="reference" style="margin-left:10px" size="mini" type="primary" 
                                v-if="scope.row.add_flag !== '1'"
                                @click="handleAddDevice(scope.row)">添加设备</el-button>
                            

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

        <add-device :visible.sync="addDeviceDialogVisible" :data="currentItem" @submit="getPreRegistrationList"></add-device>

    </div>
</template>
  
<script>
import TableTitle from "@/components/common/TableTitle.vue"
import ProductAPI from "@/api/product"
import "@/core/mixins/common"
import { message_success } from '@/utils/helpers'
import AddDevice from "./AddDevice.vue";
export default {
    name: "PreRegistration",
    components: { TableTitle, AddDevice },
    data() {
        return {
            tableData: [],
            loading: false,
            params: {
                current_page: 1,
                per_page: 10,
                total: 0,
                add_flag: "all"
            },
            addDeviceDialogVisible: false,
            currentItem: {}
        }
    },
    mounted() {
        console.log(this.$route.query)
        this.params.productName =  this.$route.query.productName;
        this.params.batchNumber = this.$route.query.batchNumber;
        this.getPreRegistrationList();
    },
    methods: {
        getPreRegistrationList() {
            this.loading = true;
            this.params.batch_id = this.$route.query.batchId;
            this.params.add_flag = this.params.add_flag === "all" ? "" : this.params.add_flag;
            ProductAPI.getPreRegistration(this.params)
                .then(({ data: result }) => {
                    if (result.code === 200) {
                        this.tableData = result.data?.data || [];
                        this.params.total = result.data.total;
                    }
                })
                .finally(() => {
                    this.loading = false;
                })
        },
        handleDelete(item) {
            ProductAPI.deletePreRegistration({ id: item.id })
                .then(({ data: result }) => {
                    if (result.code === 200) {
                        message_success("删除成功！");
                        this.getPreRegistrationList();
                    }
                })
        },
        handleAddDevice(item) {
            this.currentItem = item;
            this.addDeviceDialogVisible = true;
        }

    }
}
</script>
  
<style scoped></style>