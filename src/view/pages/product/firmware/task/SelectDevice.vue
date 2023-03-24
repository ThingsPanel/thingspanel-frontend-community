<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-15 09:58:28
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-24 15:37:58
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\product\firmware\task\SelectDevice.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <div>
        <el-dialog class="el-dark-dialog" title="请选择设备" :visible.sync="dialogVisible" width="30%"
            :before-close="() => dialogVisible = false" :close-on-click-modal="false" :append-to-body="true">
            <el-form class="inline-edit" ref="addTaskForm" label-position="left" :model="params" :hide-required-asterisk="true">
                <el-row :gutter="20">
                    <el-col :span="8">
                        <el-form-item prop="version">
                            <el-input placeholder="版本筛选" v-model="params.version"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item prop="device_name">
                            <el-input placeholder="请输入设备名称" v-model="params.device_name"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6" :offset="2" class="text-right">
                        <el-button type="border">搜索</el-button>
                    </el-col>
                </el-row>

                <el-table class="table" :data="tableData" @selection-change="handleSelectionChange">
                    <el-table-column type="selection" width="55"></el-table-column>
                    <el-table-column label="设备名称" prop="name" align="center"/>
                    <el-table-column label="版本号" prop="current_version" align="center"/>
                    <el-table-column label="设备编号" prop="device_code" align="center" :show-overflow-tooltip="true"/>
                </el-table>

                <!-- 分页 start -->
                <div class="text-right">
                    <el-pagination background layout="prev, pager, next" :total="params.total"
                        :current-page.sync="params.current_page" :page-size="params.per_page"
                        @current-change="getList"></el-pagination>
                </div>
                <!-- 分页 end -->
                
                <div class="text-right py-5">
                    已选择{{ params.count  }}个设备
                    <el-button type="border" @click="dialogVisible = false">{{ $t('COMMON.CANCEL') }}</el-button>
                    <el-button type="primary" @click="onSubmit">{{ $t('COMMON.CONFIRM') }}</el-button>
                </div>

            </el-form>
        </el-dialog>
    </div>
</template>

<script>
import ProductAPI from "@/api/product";
import { message_error } from '@/utils/helpers';
export default {
    components: {},
    props: {
        visible: {
            type: [Boolean],
            default: false
        },
        data: {
            type: [Object],
            default: () => { return {} }
        }
    },
    data() {
        return {
            tableData: [],
            params: {
                current_page: 1,
                per_page: 5,
                product_id: "",
                current_version: "",
                name: ""
            },
            deviceSelection: []
        }
    },
    computed: {
        dialogVisible: { 
            get()  {
                return this.visible;
            }, 
            set(val) {
                this.$emit("update:visible", val)
            } 
        }
    },
    mounted() {
        this.getList();
    },
    methods: {
        getList() {
            this.params.product_id = this.$route.query.productId;
            ProductAPI.getDeviceListByProductId(this.params)
                .then(({ data: result }) => {
                    if (result.code === 200) {
                        this.tableData = result.data?.data || [];
                        this.params.total = result.data?.total || 0
                    }
                })
        },
        handleSelectionChange(val) {
            this.deviceSelection = val;
        },
        onSubmit() {
            console.log("SelectDevice", this.deviceSelection)
            if (this.deviceSelection.length === 0) {
                message_error("请至少选择一个设备");
                return;
            }
            this.$emit("change", this.deviceSelection);
            this.dialogVisible = false;
        }
    }
}
</script>
<style lang="scss" scoped>
.table {
    margin: 20px 0 0 0;
}
</style>