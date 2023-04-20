<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-15 08:54:41
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-15 10:41:28
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\product\firmware\task\AddTask.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <div>
        <el-dialog class="el-dark-dialog" title="新增升级任务" :append-to-body="true"
            :visible.sync="dialogVisible" width="30%" :before-close="() => dialogVisible=false" :close-on-click-modal="false">
            <el-form ref="addTaskForm" label-position="left" :model="form"
                :hide-required-asterisk="true" label-width="150px">

                <el-form-item :label="'任务名称'" prop="task_name" required>
                    <el-input v-model="form.firmware_name"></el-input>
                </el-form-item>

                <el-form-item :label="'升级时间'" prop="upgrade_time">
                    <el-select v-model="form.upgrade_time">
                        <el-option label="立即升级" value="immediate"></el-option>
                    </el-select>
                </el-form-item>

                <el-form-item :label="'选择设备'" >
                    <el-select v-model="form.deviceMode">
                        <el-option label="全部设备" value="0"></el-option>
                        <el-option label="选择设备" value="1"></el-option>
                    </el-select>
                    
                </el-form-item>

                <el-form-item prop="devices">
                    <el-input readonly placeholder="点这里选择设备"
                        v-if="form.deviceMode==='1'" 
                        @click.native="selectDeviceDialogVisible=true"></el-input>
                    <select-device :visible.sync="selectDeviceDialogVisible"></select-device>
                </el-form-item>
            

                <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.DESCRIPTION')"
                    prop="description">
                    <el-input type="textarea" v-model="form.description"></el-input>
                </el-form-item>



                <div class="text-right">
                    <el-button type="border"  @click="onSubmit">{{$t('COMMON.CONFIRM') }}</el-button>
                    <el-button type="primary" @click="dialogVisible=false">{{$t('COMMON.CANCEL') }}</el-button>
                </div>
                
            </el-form>
        </el-dialog>
    </div>
</template>
<script>
import SelectDevice from './SelectDevice.vue';
export default {
    name: 'AddTask',
    components: { SelectDevice},
    props: {
        visible: {
            type: [Boolean],
            default: false
        }
    },
    data() {
        return {
            form: {
                task_name: "",
                upgrade_time: "",
                device: [],
                description: ""
            },
            selectDeviceDialogVisible: false
        };
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
    methods: {
        onSubmit() {

            this.dialogVisible = false;
        }
    },
};
</script>
<style  scoped>
    
</style>