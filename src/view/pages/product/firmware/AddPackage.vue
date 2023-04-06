<template>
    <div class="firmware-create">
        <el-dialog class="el-dark-dialog" title="添加升级包"
            :visible.sync="dialogVisible" width="540px" :before-close="() => dialogVisible=false" :close-on-click-modal="false">
            <el-form ref="firmwareCreateForm" :rules="rules" label-position="left" :model="form"
                label-width="150px">

                <!-- 升级包名称 -->
                <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PACKAGE_NAME')"
                    prop="package_name" required>
                   
                    <!-- 给el-input添加tooltip -->
                    <el-tooltip effect="dark" content="支持中文、英文、数字、下划线（_）、中划线（-）、小括号（()），必须以中文、英文或数字开头，长度不能超过 40 个字符" placement="top">
                        <el-input v-model="form.package_name" maxlength="40" show-word-limit></el-input>   
                    </el-tooltip>
                </el-form-item>

                <!-- 归属产品 -->
                <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.BELONGINGPRODUCT')"
                    prop="product_id">
                    <el-select v-model="form.product_id">
                        <el-option v-for="(product, index) in productList" :key="index"
                            :label="product.name" :value="product.id"></el-option>
                    </el-select>
                </el-form-item>

                <!-- 升级包模块 -->
                <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PACKAGE_MODULE')"
                    prop="package_module">
                    <!-- 给el-input添加tooltip -->
                    <el-tooltip effect="dark" content="支持英文字母、数字、点、中划线和下划线，长度限制 1～64 个字符" placement="top">
                        <el-input v-model="form.package_module"></el-input> 
                    </el-tooltip>
                </el-form-item>

                <!-- 升级包版本号 -->
                <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PACKAGE_VERSION')"
                    prop="package_version">
                    <!-- 给el-input添加tooltip -->
                    <el-tooltip effect="dark" content="仅支持英文字母、数字、点号（.）、中划线（-）和下划线（_），长度限制为 1~64 个字符" placement="top">
                        <el-input v-model="form.package_version" placeholder="例：v1.0.0"></el-input>    
                    </el-tooltip>
                </el-form-item>

                <!-- 签名方式 -->
                <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.SIGNTYPE')" prop="signature_algorithm">
                    <el-select v-model="form.signature_algorithm">
                        <el-option label="MD5" value="MD5"></el-option>
                        <el-option label="SHA256" value="SHA256"></el-option>
                    </el-select>
                </el-form-item>

                <!-- 上传升级包 -->
                <el-form-item label="上传升级包" required prop="packageUrl">
                    <el-upload ref="upload"
                        class="upload-demo"
                        :action="uploadUrl"
                        :headers="headers"
                        :data="{ type: 'upgradePackage'}"
                        accept=".bin,.tar,.gz,.tar.xz,.zip,.gzip,.apk,.dav,.pack"
                        :file-list="fileList"
                        :limit="2"
                        :on-change="onUploadChange"
                        :on-success="onUploadSuccess"
                        :auto-upload="false"
                        >
                        <el-button slot="trigger" size="small" type="border">选取文件</el-button>
                        <!-- 给el-button添加tooltip -->
                        <el-tooltip effect="dark" content="仅支持 bin、tar、gz、tar.xz、zip、gzip、apk、dav、pack 类型的文件，文件名支持中文、英文字母、数字和下划线，长度限制1~32个字符，文件总大小最大为1000MB" placement="top">
                            <el-button style="margin-left: 10px;" size="small" type="success" @click="submitUpload">上传到服务器</el-button>
                        </el-tooltip>
                    </el-upload>
                </el-form-item>


                <!-- 描述 -->
                <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.DESCRIPTION')"
                    prop="description">
                    <el-input type="textarea" v-model="form.description"></el-input>
                </el-form-item>

                <!-- 其他配置 -->
                <el-form-item style="line-height: 30px;" :label="'其他配置'">
                    <el-row v-for="(config, index) in form.additional_info" :key="index">
                        <el-col :span="7" style="margin-right:10px">
                            <el-input size="small" placeholder="key" v-model="config.key"></el-input>
                        </el-col>
                        <el-col :span="7" style="margin-right:10px">
                            <el-input size="small" placeholder="value" v-model="config.value"></el-input>
                        </el-col>
                        <el-col :span="6"  :offset="2">
                            <el-button size="small" type="border" v-if="index===0" @click="handleAddConfig">增加一行</el-button>
                            <el-button size="small" type="danger" v-else @click="handleDeleteConfig(config)">删除</el-button>
                        </el-col>
                    </el-row>
                </el-form-item>

                <div class="text-right">
                    <el-button type="border" @click="dialogVisible=false">{{$t('COMMON.CANCEL') }}</el-button>
                    <el-button type="primary"  @click="handleSubmit">{{$t('COMMON.CONFIRM') }}</el-button>
                </div>
                
            </el-form>
        </el-dialog>
    </div>
</template>
    
<script>
import moment from "moment";
import i18n from "@/core/plugins/vue-i18n.js";
import ProductAPI from "@/api/product";
import OTAAPI from "@/api/ota";
import JwtService from "@/core/services/jwt.service";
import { message_success } from '../../../../utils/helpers';

import { local_url } from "@/api/LocalUrl"

export default {
    name: "AddPackage",
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
    computed: {
        dialogVisible: {
            get() {
                return this.visible;
            },
            set(val) {
                this.$emit("update:visible", val);
            }
        }
    },
    data: () => ({
        form: {
            product_id: "",
            package_name: "",
            package_version: "",
            package_url: "",
            packageUrl: "",
            package_module: "default",
            signature_algorithm: "MD5",
            description: "",
            additional_info: [
                {}
            ]
        },
        uploadUrl: OTAAPI.uploadUrl,
        fileList: [],
        headers: { Authorization: "Bearer " + JwtService.getToken() },
        productList: [],
        rules: {
            product_id: [
                { required: true, message: i18n.t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PLACEHOLDER1') }
            ],
            package_name: [
                { 
                    required: true, 
                    message: i18n.t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PLACEHOLDER2') ,
                }
            ],
            package_module: [
                { required: true, message: i18n.t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PLACEHOLDER2') }
            ],
            packageUrl: [
                { required: true, message: "请上传升级包！" }
            ],
            package_version: [
                { required: true, message: i18n.t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PLACEHOLDER3') }
            ],
            sign: [
                { required: true, message: i18n.t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.PLACEHOLDER4') }
            ]
        }
    }),
    mounted() {
        this.getProductList();
    },
    methods: {
        /**
         * @description: 产品下拉列表
         * @return {*}
         */        
        getProductList() {
            const params = { current_page: 1, per_page: 9999 }
            ProductAPI.page(params)
                .then(({ data: result }) => {
                    if (result.code === 200) {
                        this.productList = result.data?.data || [];
                    }
                })
        },
        /**
         * @description: 提交
         * @param {*} res
         * @param {*} file
         * @return {*}
         */
        handleSubmit() {
            console.log("handleSubmit", this.form, this.fileList)
            this.$refs.firmwareCreateForm.validate((valid) => {
                if (valid) {
                    let formData = JSON.parse(JSON.stringify(this.form))
                    let additionalInfo = {};
                    formData.additional_info.forEach(item => {
                        additionalInfo[item.key] = item.value;
                    })
                    formData.additional_info = JSON.stringify(additionalInfo);
                    formData.created_at = moment().format("YYYY-MM-DD HH:mm:ss")
                    OTAAPI.add(formData)
                        .then(({ data: result }) => {
                            console.log("handleSubmit", result)
                            if (result.code === 200) {
                                this.dialogVisible = false;
                                message_success("添加成功!")
                                this.$emit("submit");

                            }
                        })

                    // setTimeout(() => {
                    //     this.$refs.firmwareCreateForm.resetFields()
                    // }, 500)
                }
            })
        },
        /**
         * @description: 增加配置
         * @return {*}
         */
        handleAddConfig() {
            this.form.additional_info.push({})
        },
        /**
         * @description: 删除配置
         * @param {*} config
         * @return {*}
         */
        handleDeleteConfig(config) {
            const index = this.form.additional_info.findIndex(item => item === config);
            this.form.additional_info.splice(index, 1);
        },
        // 如果前两个字符是./，则去除字符串前两个字符
        removeDotSlash(str) {
            if (str.indexOf('./') === 0) {
                return str.slice(2);
            }
            return str;
        },
        submitUpload() {
            this.$refs.upload.submit();
        },
        onUploadChange(file, fileList) {
            this.fileList = [];
            this.fileList.push(file);
        },
        onUploadSuccess(response, file, fileList) {
            console.log("onUploadSuccess", response, file, fileList)
            if (response.code === 200) {
                this.form.packageUrl = local_url + this.removeDotSlash(response.data);
                this.form.package_path = this.form.packageUrl;
                this.form.package_url = this.form.packageUrl;
            } else {
                this.$message.error(response.msg);
            }
        }
    }
}
</script>
    
<style lang="scss" scope>
.el-upload-list__item-name {
    color: #fff;
}
//.firmware-create{
//  .el-form-item__label{
//    color: #fff;
//  }
//
//  .el-upload-dragger{
//    background-color: rgba(22, 30, 67, 0.5) !important;
//  }
//
//  textarea{
//    background-color: rgba(22, 30, 67, 0.5) !important;
//    color: #b3b7c1 !important;
//  }
//
//  .el-radio__label{
//    color: #b3b7c1 !important;
//  }
//}
</style>