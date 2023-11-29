<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-11-20 16:27:47
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-11-22 14:19:04
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\console\index.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <div class="rounded card p-4">
        <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
            <el-col :span="12">
                <TableTitle>{{ $t('VISUALIZATION.CONSOLE.CONSOLE') }}</TableTitle>
            </el-col>

            <el-col :span="12" class="px-2 text-right">
                <el-button size="medium" type="border" @click="handleCreate()">{{ $t('VISUALIZATION.CONSOLE.CREATE_CONSOLE') }}</el-button>
            </el-col>
        </el-row>
        <!-- 表 start -->
        <el-form class="inline-edit">
            <el-table :data="tableData" v-loading="loading">
                <!-- 序号 -->
                <el-table-column :label="$t('VISUALIZATION.CONSOLE.NO')" type="index" align="left" min-width="110" width="200">
                    <template v-slot="scope">
                        <span>{{ (params.current_page - 1) * 10 + scope.$index + 1 }}</span>
                    </template>
                </el-table-column>

                <!-- 看板名称 -->
                <el-table-column :label="$t('VISUALIZATION.CONSOLE.CONSOLE_NAME')" prop="name" align="left">
                    <template v-slot="scope">
                        <div class="w-100 cursor-pointer" @click="handleViewConsole(scope.row)">
                            <p class="mad">{{ scope.row.name }}</p>
                        </div>
                    </template>
                </el-table-column>

                <!-- 创建时间 -->
                <el-table-column :label="$t('VISUALIZATION.CONSOLE.CREATED_TIME')" prop="created_at" align="left">
                    <template v-slot="scope">
                        {{ scope.row.created_at ? formatDate(scope.row.created_at) : "" }}
                    </template>
                </el-table-column>

                <!-- 操作 -->
                <el-table-column align="left" :label="$t('COMMON.OPERATION')" width="230">
                    <template v-slot="scope">
                        <div style="text-align: left">
                            <!-- 分享 --> 
                            <el-button type="yellow" size="mini" @click="shareConsole(scope.row)">{{ $t('COMMON.SHARE') }}</el-button>
                            <!-- 编辑 -->
                            <el-button type="indigo" size="mini" @click="handleEditConsole(scope.row)">{{ $t('COMMON.EDIT')}}</el-button>
                            <!-- 删除 -->
                            <el-popconfirm :confirm-button-text="$t('COMMON.CONFIRM')"
                                :cancel-button-text="$t('COMMON.CANCEL')"
                                style="margin-left: 10px" :title="$t('VISUALIZATION.TEXT44')"
                                @confirm="handleDelConsole(scope.row)">
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
        <el-dialog class="el-dark-dialog" :title="$t('VISUALIZATION.CONSOLE.SHARE_COSNOLE')" v-bind="dialogSettings" :visible.sync="shareDialogVisible" close-on-click-modal>
            <el-form class="console-share-form el-dark-input" label-position="left"  label-width="120px">

                <!-- 分享链接 -->
                <el-form-item :label="$t('VISUALIZATION.CONSOLE.SHARE_LINK')">
                    <el-input readonly v-model="shareData.url"></el-input>
                </el-form-item>

                <el-form-item :label="$t('VISUALIZATION.CONSOLE.WHO_CAN_ACCESS')">
                    <el-row class="w-full">
                        <el-col :span="3">
                            <el-radio-group v-model="shareData.permission" type="vertical" @change="handleSharePermissionChange">
                                <el-radio label="0" size="small" class="my-5">{{ $t('VISUALIZATION.CONSOLE.ONLY_ME') }}</el-radio>
                                <el-radio label="1" size="small">{{ $t('VISUALIZATION.CONSOLE.EVERYONE') }}</el-radio>
                            </el-radio-group>
                        </el-col>
                    </el-row>

                </el-form-item>
                
            </el-form>
            <div class="dialog-footer">
                <el-button type="primary" @click="gotoShare">{{ $t('VISUALIZATION.CONSOLE.OPEN_LINK') }}</el-button>
                <el-button class="copy-qb" type="primary" @click="handleCopyAndClose">{{ $t('VISUALIZATION.CONSOLE.COPY_AND_CLOSE') }}</el-button>
                <!-- <el-button type="primary" @click="shareDialogVisible=false">关闭</el-button> -->
            </div>
        </el-dialog>
        <!-- 创建分享对话框 end -->

        <!-- 创建看板对话框 start -->
        <el-dialog class="el-dark-dialog" :title="$t('VISUALIZATION.CONSOLE.CREATE_CONSOLE')" v-bind="dialogSettings"  :visible.sync="createDialogVisible">
            <el-form class="console-create-form el-dark-input" label-position="left"  label-width="140px" 
                ref="createFormRef" :model="formData" :rules="formRules">

                <!-- 看板名称 -->
                <el-form-item :label="$t('VISUALIZATION.CONSOLE.CONSOLE_NAME')" prop="name">
                    <el-input style="width: 280px" v-model="formData.name"></el-input>
                </el-form-item>

                <!-- 创建方式 -->
                <el-form-item :label="$t('VISUALIZATION.CONSOLE.CREATE_METHOD')" prop="mode">
                    <el-radio-group v-model="formData.mode" size="small">
                        <div style="display: flex">
                            <el-radio :disabled="true" label="template">{{ $t('VISUALIZATION.CONSOLE.IMPORT_FROM_TEMPLATE') }}</el-radio>
                            <el-input :disabled="formData.mode!=='template'" v-model="formData.code"
                                :placeholder="$t('VISUALIZATION.CONSOLE.PLEASE_INPUT_TEMPLATE_ID')"
                                ></el-input>
                        </div>
                        <div><el-radio label="blank">{{ $t('VISUALIZATION.CONSOLE.CREATE_BLANK_CONSOLE') }}</el-radio></div>
                      </el-radio-group>
                </el-form-item>
                
            </el-form>
            <div class="dialog-footer">
                <el-button type="primary" @click="handleSubmit">{{ $t('COMMON.CREATE') }}</el-button>
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
import "@/core/mixins/common"

export default {
    components: { TableTitle },
    props: {},
    data() {
        const validateTemplateCode = (rule, value, callback) => {
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
                console_id: "",
                id: "",
                url: "",
                permission: "0"
            },
        }
    },
    watch: {
        $route: {
            handler(route) {
                if (JSON.stringify(route.query) !=="{}") {
                    this.params = { 
                        current_page:  Number(route.query.current_page), 
                        per_page: Number(route.query.per_page) 
                    };
                }
                this.getList();
            }, immediate: true
        },
        shareDialogVisible:{
            handler(newValue){
                if(!newValue) {
                    this.shareData = {
                        console_id: "",
                        id: "",
                        url: "",
                        permission: "0"
                    }
                }
            }
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
                    this.total = result.data?.total || 0;
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
            this.handleEditConsole(item);
        },
        /**
         * @description: 分享看板
         * @param {*} item
         * @return {*}
         */        
        shareConsole(item) {
            this.shareData.console_id = item.id;
            this.shareData.id = item.share_id;
            this.shareData.url = `${document.location.origin}/#/kanban/detail?id=${item.id}`
            this.shareDialogVisible = true;
            // this.$router.push({ name: "ShareConsole", query: { id: item.id } })
        },
        /**
         * @description: 编辑看板
         * @param {*} item
         * @return {*}
         */        
        handleEditConsole(item) {
            this.$router.push({ name: "Dashboard", query: { ...this.params, id: item.id } })
        },
        /**
         * @description: 删除看板
         * @return {*}
         */        
        handleDelConsole(item) {
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
        },
        // 根据权限生成分享链接
        handleSharePermissionChange(){
            if(this.shareData.permission !== "1"){
                this.shareData.url = `${document.location.origin}/#/kanban/detail?id=${this.shareData.console_id}`
                return;
            };
            if(!this.shareData.console_id) return;
            if(!this.shareData.id) {
                
                ConsoleAPI.generateShareID({id: this.shareData.console_id, share_type: "console"})
                    .then(({ data: result }) => {
                        console.error(result, result.data?.share_id)
                        this.shareData.id = result.data?.share_id;
                        this.shareData.url = `${document.location.origin}/#/kanban/share?id=${result.data?.share_id}`

                        message_success("生成分享ID成功");
                    })
            };
            this.shareData.url = `${document.location.origin}/#/kanban/share?id=${this.shareData.id}`
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
    .console-share-form {
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