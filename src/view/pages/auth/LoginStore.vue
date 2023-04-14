<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-20 14:35:59
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-04-07 09:00:57
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\plugin\list\LoginStore.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <div>
        <el-dialog class="el-dark-dialog" title="登录应用商店" :visible.sync="dialogVisible" width="30%"
            :before-close="() => handleCancel()" :close-on-click-modal="false" :append-to-body="true">
            <el-form class="inline-edit" ref="LoginForm" label-position="left" 
                :model="formData" :rules="formRules"
                :hide-required-asterisk="true">
                    
                <el-form-item label="用户名" prop="username">
                    <el-input v-model="formData.username"></el-input>
                </el-form-item>

                <el-form-item label="密码" prop="password">
                    <el-input v-model="formData.password" show-password></el-input>
                </el-form-item>
                
                <div class="text-right py-5">
                    <el-link class="link-signup" href="http://r.thingspanel.cn/" type="success" target="_blank">没有账号？去创建</el-link>
                    <el-button type="border" @click="handleCancel">{{ $t('COMMON.CANCEL') }}</el-button>
                    <el-button type="primary" :loading="btnLoading" @click="handleSubmit">{{ $t('COMMON.LOG1') }}</el-button>
                </div>

            </el-form>
        </el-dialog>
    </div>
</template>

<script>
import {LOGIN} from "@/core/services/store/app-store.module"
import { message_success } from '@/utils/helpers';
export default {
    components: {},
    props: {
        visible: {
            type: [Boolean],
            default: false
        },
        /**
         * @description: 登录状态回调
         * @param {code, msg} 
         * @return {*}
         */
        login: {
            type: [Function],
            default: () => {}
        }
    },
    data() {
        return {
            formData: {
                username: "",
                password: ""
            },
            formRules: {
                username: [
                    { required: true, message: "请输入用户名", trigger: "blur" },
                    { min: 3, max: 20, message: "长度在 3 到 20 个字符", trigger: "blur" }
                ],
                password: [
                    { required: true, message: "请输入密码", trigger: "blur" },
                    { min: 6, max: 20, message: "长度在 6 到 20 个字符", trigger: "blur" }
                ]
            },
            btnLoading: false
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
        handleCancel() {
            this.dialogVisible = false;
            this.login({ code: 400, msg: "取消登录"});
        },
        /**
         * @description: 登录
         * @return {*}
         */
        handleSubmit() {
            this.btnLoading = true;
            this.$refs.LoginForm.validate(valid => {
                if (valid) {
                    this.$store.dispatch(LOGIN, this.formData)
                        .then(res => {
                            if (res.code === 0) {
                                message_success("登陆成功！");
                                this.dialogVisible = false;
                                this.login({ code: 200, msg: "登录成功" })
                            }
                        })
                        .finally(() => {
                            this.btnLoading = false;
                        })
                } else {
                    this.btnLoading = false;
                    return false;
                }
            })
            
        }
    }
}
</script>
<style lang="scss" scoped>
.link-signup {
    margin-right: 20px;
}
</style>