<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-20 14:35:59
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-21 14:10:54
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\plugin\list\LoginStore.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <div>
        <el-dialog class="el-dark-dialog" title="登录应用商店" :visible.sync="dialogVisible" width="30%"
            :before-close="() => dialogVisible = false" :close-on-click-modal="false" :append-to-body="true">
            <el-form class="inline-edit" ref="LoginForm" label-position="left" :model="formData" :hide-required-asterisk="true">
                    
                <el-form-item label="用户名">
                    <el-input v-model="formData.username"></el-input>
                </el-form-item>

                <el-form-item label="密码">
                    <el-input v-model="formData.password"></el-input>
                </el-form-item>
                
                <div class="text-right py-5">
                    <el-link class="link-signup" href="" type="success" target="_blank">没有账号？去创建</el-link>
                    <el-button type="border" @click="dialogVisible = false">{{ $t('COMMON.CANCEL') }}</el-button>
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
        }
    },
    data() {
        return {
            formData: {
                username: "17398467065",
                password: "123456"
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
        /**
         * @description: 登录
         * @return {*}
         */
        handleSubmit() {
            this.btnLoading = true;
            this.$store.dispatch(LOGIN, this.formData)
                .then(res => {
                    if (res.code === 0) {
                        message_success("登陆成功！");
                        this.dialogVisible = false;
                    }
                    console.log(res)
                })
                .finally(() => {
                    this.btnLoading = false;
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