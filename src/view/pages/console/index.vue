<template>
    <div class="rounded card p-4">
        <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
            <el-col :span="12">
                <TableTitle>看板</TableTitle>
            </el-col>

            <el-col :span="12" class="px-2 text-right">
                <el-button size="medium" type="border" @click="handleCreate()">创建看板</el-button>
            </el-col>
        </el-row>
        <!-- 表 start -->
        <el-form class="inline-edit">
            <el-table :data="tableData" v-loading="loading">
                <el-table-column :label="$t('VISUALIZATION.NO')" type="index" align="left" min-width="110" width="200">
                    <template v-slot="scope">
                        <span>{{ (params.current_page - 1) * 10 + scope.$index + 1 }}</span>
                    </template>
                </el-table-column>

                <el-table-column label="看板名称" prop="name" align="left">
                    <template v-slot="scope">
                        <div class="w-100 cursor-pointer" @click="handleViewConsole(scope.row)">
                            <p class="mad">{{ scope.row.name }}</p>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column align="left" :label="$t('VISUALIZATION.OPERATION')" width="230">
                    <template v-slot="scope">
                        <div style="text-align: left">

                            <el-button type="indigo" size="mini" @click="editConsole(scope.row)">{{ $t('VISUALIZATION.EDIT')
                            }}</el-button>
                            <el-popconfirm :confirm-button-text="$t('COMMON.CONFIRM')"
                                :cancel-button-text="$t('COMMON.CANCEL')"
                                style="margin-left: 10px" :title="$t('VISUALIZATION.TEXT44')"
                                @confirm="delConsole(scope.row)">
                                <el-button slot="reference" type="danger" size="mini">{{ $t('VISUALIZATION.DELETE')
                                }}</el-button>
                            </el-popconfirm>
                        </div>
                    </template>
                </el-table-column>

                <template #empty>
                    <div>{{ $t('COMMON.TABLE_NO_DATA') }}</div>
                </template>
            </el-table>
        </el-form>
        <!-- 表 end -->
        <div class="text-right py-3">
            <el-pagination background layout="prev, pager, next" :total="total" :current-page.sync="params.current_page"
                :page-size="params.per_page" @current-change="getList"></el-pagination>
        </div>



        <!-- 创建看板对话框 start -->
        <el-dialog class="el-dark-dialog" title="创建看板" custom-class="edit-dialog"
            :visible.sync="dialogVisible" :close-on-click-modal="false">
            <el-form class="console-create-form el-dark-input" label-position="left"  label-width="80px" 
                ref="createFormRef" :model="formData" :rules="formRules">

                <el-form-item label="看板名称" prop="name">
                    <el-input style="width: 280px" v-model="formData.name"></el-input>
                </el-form-item>

                <el-form-item label="创建方式" prop="mode">
                    <el-radio-group v-model="formData.mode" size="small">
                        <div style="display: flex">
                            <el-radio label="template">从模板导入</el-radio>
                            <el-input :disabled="formData.mode!=='template'" v-model="formData.code"
                                :placeholder="'请输入模板编码'"
                                ></el-input>
                        </div>
                        <div><el-radio label="blank">创建空白模板</el-radio></div>
                      </el-radio-group>
                </el-form-item>
                
            </el-form>
            <div class="dialog-footer">
                <el-button type="primary" @click="handleSubmit">创建</el-button>
            </div>
        </el-dialog>
        <!-- 创建看板对话框 end -->

    </div>
</template>

<script>
import TableTitle from "@/components/common/TableTitle.vue";
import ConsoleAPI from "@/api/console.js";
import { message_success } from "@/utils/helpers.js";
export default {
    components: { TableTitle },
    props: {},
    data() {
        const validateTemplateCode = (rule, value, callback) => {
            console.log("validateTemplateCode", rule, value);
            if (value === "template") {
                callback(new Error("请输入模板编码!"));
            } else if (!value) {
                callback(new Error("请选择创建方式!"))
            } else {
                callback();
            }
        };
        return {
            // 列表数据
            tableData: [],
            // 表格加载中
            loading: false,
            // 分页参数
            params: {
                // 当前页
                current_page: 1,
                // 当前页面条数
                per_page: 10
            },
            // 列表数据总数
            total: 0,
            // 是否显示创建看板对话框
            dialogVisible: false,
            // 创建看板数据
            formData: {
                name: "",
                mode: "blank",
                code: ""
            },
            // 创建看板验证数据
            formRules: {
                name: [
                    { required: true, message: '请输入看板名称', trigger: 'blur' }
                ],
                mode: [
                    { validator: validateTemplateCode, trigger: 'blur' }
                ]
            }
        }
    },
    watch: {
        $route: {
            handler(route) {
                console.log("$route", route)
                this.getList();
            }, immediate: true
        }
    },
    methods: {
        /**
         * @description: 获取看板列表
         * @return {*}
         */        
        getList() {
            ConsoleAPI.list(this.params)
                .then(({ data: result }) => {
                    console.log("getList", result);
                    this.tableData = result.data?.data || [];
                })
        },
        /**
         * @description: 打开创建看板对话框
         * @return {*}
         */        
        handleCreate() {
            this.dialogVisible = true;
        },
        /**
         * @description: 查看看板
         * @param {*} item
         * @return {*}
         */
        handleViewConsole(item) {
            this.$router.push({name: "Dashboard", query: {consoleId: item.id}})
        },
        /**
         * @description: 编辑看板
         * @param {*} item
         * @return {*}
         */        
        editConsole(item) {
            this.$router.push({name: "Dashboard", query: {consoleId: item.id}})
        },
        /**
         * @description: 删除看板
         * @return {*}
         */        
        delConsole(item) {
            if (!item.id) return;
            ConsoleAPI.delete({ id: item.id })
                .then(({ data: result }) => {
                    if (result.code === 200) {
                        message_success("已删除看板");
                        this.getList();
                    }
                })
        },
        /**
         * @description: 创建看板
         * @return {*}
         */        
        handleSubmit() {
            this.$refs.createFormRef.validate(valid => {
                if (valid) {
                    if (this.formData.mode === "blank") {
                        const params = {
                            name: this.formData.name
                        }
                        ConsoleAPI.add(params)
                            .then(({ data: result }) => {
                                console.log("handleCreate", result);
                                if (result.code === 200) {
                                    message_success("创建看板成功");
                                    this.dialogVisible = false;
                                    this.getList();
                                }
                            })
                    }
                    // this.$router.push({name: "Dashboard", query: {consoleId: this.formData.id}})
                }
            })
        }
    }
}
</script>
<style lang="scss" scoped>
::v-deep .edit-dialog {
    width: 600px!important;
    .console-create-form {
        margin: 40px 100px;
        .el-radio {
            line-height: 40px;
        }
    }
    .dialog-footer {
        text-align: center;
    }
}

</style>