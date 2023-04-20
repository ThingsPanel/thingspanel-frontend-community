<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-15 09:58:28
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-15 10:37:39
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\product\firmware\task\SelectDevice.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <div>
        <el-dialog class="el-dark-dialog" title="请选择设备" :visible.sync="dialogVisible" width="30%"
            :before-close="() => dialogVisible = false" :close-on-click-modal="false" :append-to-body="true">
            <el-form class="inline-edit" ref="addTaskForm" label-position="left" :model="params" :hide-required-asterisk="true"
                >
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

                <el-table class="table" :data="tableData">
                    <el-table-column label="设备名称" prop="name" align="center"/>
                    <el-table-column label="版本号" prop="version" align="center"/>
                    <el-table-column label="设备编号" prop="number" align="center"/>
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
                    <el-button type="border" @click="onSubmit">{{ $t('COMMON.CONFIRM') }}</el-button>
                    <el-button type="primary" @click="dialogVisible = false">{{ $t('COMMON.CANCEL') }}</el-button>
                </div>

            </el-form>
        </el-dialog>
    </div>
</template>

<script>
export default {
    components: {},
    props: {
        visible: {
            type: [Boolean],
            default: false
        }
    },
    data() {
        return {
            tableData: [],
            params: {
                version: "",
                device_name: "",
                count: 0,
                total: 0,
                current_page: 1,
                per_page: 5
            }
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
    methods: {
        getList() {

        },
        onSubmit() {

        }
    }
}
</script>
<style lang="scss" scoped>
.table {
    margin: 20px 0 0 0;
}
</style>