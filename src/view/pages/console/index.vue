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
                <!-- 序号 -->
                <el-table-column :label="$t('VISUALIZATION.NO')" type="index" align="left" min-width="110" width="200">
                    <template v-slot="scope">
                        <span>{{ (params.current_page - 1) * 10 + scope.$index + 1 }}</span>
                    </template>
                </el-table-column>

                <!-- 看板名称 -->
                <el-table-column label="看板名称" prop="name" align="left">
                    <template v-slot="scope">
                        <div class="w-100 cursor-pointer" @click="handleViewConsole(scope.row)">
                            <p class="mad">{{ scope.row.name }}</p>
                        </div>
                    </template>
                </el-table-column>

                <!-- 操作 -->
                <el-table-column align="left" :label="$t('VISUALIZATION.OPERATION')" width="230">
                    <template v-slot="scope">
                        <div style="text-align: left">
                            <!-- 分享 -->
                            <!-- <el-button type="yellow" size="mini" @click="shareConsole(scope.row)">分享</el-button> -->
                            <!-- 编辑 -->
                            <el-button type="indigo" size="mini" @click="editConsole(scope.row)">{{ $t('VISUALIZATION.EDIT')}}</el-button>
                            <!-- 删除 -->
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

        <!-- 分页 start -->
        <div class="text-right py-3">
            <el-pagination background layout="prev, pager, next" :total="total" :current-page.sync="params.current_page"
                :page-size="params.per_page" @current-change="getList"></el-pagination>
        </div>
        <!-- 分页 end -->

        <!-- 分享看板对话框 start -->
        <el-dialog class="el-dark-dialog" title="分享看板" v-bind="dialogSettings" :visible.sync="shareDialogVisible">
            <el-form class="console-shaer-form el-dark-input" label-position="left"  label-width="80px">

                <!-- 分享链接 -->
                <el-form-item label="分享链接:">
                    <el-input readonly v-model="shareData.url"></el-input>
                </el-form-item>
                
            </el-form>
            <div class="dialog-footer">
                <el-button type="primary" @click="gotoShare">打开链接</el-button>
                <el-button class="copy-qb" type="primary" @click="handleCopyAndClose">复制链接并关闭</el-button>
                <!-- <el-button type="primary" @click="shareDialogVisible=false">关闭</el-button> -->
            </div>
        </el-dialog>
        <!-- 创建分享对话框 end -->

        <!-- 创建看板对话框 start -->
        <el-dialog class="el-dark-dialog" title="创建看板" v-bind="dialogSettings"  :visible.sync="createDialogVisible">
            <el-form class="console-create-form el-dark-input" label-position="left"  label-width="80px" 
                ref="createFormRef" :model="formData" :rules="formRules">

                <!-- 看板名称 -->
                <el-form-item label="看板名称" prop="name">
                    <el-input style="width: 280px" v-model="formData.name"></el-input>
                </el-form-item>

                <!-- 创建方式 -->
                <el-form-item label="创建方式" prop="mode">
                    <el-radio-group v-model="formData.mode" size="small">
                        <div style="display: flex">
                            <el-radio :disabled="true" label="template">从模板导入</el-radio>
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
import { DEFAULT_SETTING_DATA } from "./Const.js";
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
            createDialogVisible: false,
            // 是否显示分享看板对话框
            shareDialogVisible: false,
            // 对话框设置
            dialogSettings: {
                customClass: "edit-dialog",
                closeOnClickModal: false,
            },
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
            },
            // 分享看板数据
            shareData: {
                url: ""
            },
        }
    },
    watch: {
        $route: {
            handler(route) {
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
                    this.tableData = result.data?.data || [];
                })
        },
        /**
         * @description: 打开创建看板对话框
         * @return {*}
         */        
        handleCreate() {
            this.createDialogVisible = true;
        },
        /**
         * @description: 查看看板
         * @param {*} item
         * @return {*}
         */
        handleViewConsole(item) {
            this.$router.push({ name: "Dashboard", query: { id: item.id } })
        },
        /**
         * @description: 分享看板
         * @param {*} item
         * @return {*}
         */        
        shareConsole(item) {
            console.log("shareConsole", item.id, document.location.origin);
            this.shareData.url = `${document.location.origin}/#/share_console?id=${item.id}#${item.name}`
            this.shareDialogVisible = true;
            // this.$router.push({ name: "ShareConsole", query: { id: item.id } })
        },
        /**
         * @description: 编辑看板
         * @param {*} item
         * @return {*}
         */        
        editConsole(item) {
            this.$router.push({ name: "Dashboard", query: { id: item.id } })
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
         * @description: 打开链接
         * @return {*}
         */        
        gotoShare() {
            window.open(this.shareData.url, '_blank');
        },
        /**
         * @description: 复制链接并关闭
         * @return {*}
         */        
        handleCopyAndClose() {
            let clipboard = new ClipboardJS('.copy-qb', {
                text: () => {
                    return this.shareData.url
                }
            })
            clipboard.on('success', () => {
                message_success("复制成功！");
                clipboard.destroy()
                this.shareDialogVisible = false;
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
                            name: this.formData.name,
                            config: JSON.stringify({ background: "#28367a" })
                        }
                        ConsoleAPI.add(params)
                            .then(({ data: result }) => {
                                console.log("handleCreate", result);
                                if (result.code === 200) {
                                    message_success("创建看板成功");
                                    this.createDialogVisible = false;
                                    this.resetForm();
                                    this.getList();
                                }
                            })
                    }
                    // this.$router.push({name: "Dashboard", query: {consoleId: this.formData.id}})
                }
            })
        },
        resetForm() {
            this.formData = {
                name: "",
                mode: "blank",
                code: ""
            }
        }
    }
}
</script>
<style lang="scss" scoped>
::v-deep .edit-dialog {
    width: 800px!important;
    .console-create-form {
        margin: 40px 100px;
        .el-radio {
            line-height: 40px;
        }
    }
    .console-shaer-form {
        margin: 40px;
        .el-input {
            width: 100%!important;
        }
    }
    .dialog-footer {
        text-align: center;
    }
}

</style>