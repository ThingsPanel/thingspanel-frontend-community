<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-15 08:54:41
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-24 16:15:53
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\product\firmware\task\AddTask.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <div>
        <el-dialog class="el-dark-dialog" title="新增升级任务" :append-to-body="true"
            :visible.sync="dialogVisible" width="30%" :before-close="() => dialogVisible=false" :close-on-click-modal="false">
            <el-form class="el-dark-input" ref="addTaskForm" label-position="left" :model="form" :rules="rules" 
                label-width="150px">

                <el-form-item :label="'任务名称'" prop="task_name" required>
                    <el-input v-model="form.task_name"></el-input>
                </el-form-item>

                <el-form-item :label="'升级时间'" prop="upgrade_time_type" required>
                    <el-select v-model="form.upgrade_time_type">
                        <el-option label="立即升级" value="0"></el-option>
                        <el-option label="待升级" value="1"></el-option>
                    </el-select>
                </el-form-item>

                <el-form-item v-if="form.upgrade_time_type==='1'">
                    <el-date-picker  type="datetime" placeholder="选择升级时间" value-format="yyyy-MM-dd HH:mm:ss"
                        v-model="form.start_time" ></el-date-picker>
                </el-form-item>

                <el-form-item :label="'选择设备'" prop="select_device_flag" required>
                    <el-select v-model="form.select_device_flag">
                        <el-option label="全部设备" value="0"></el-option>
                        <el-option label="选择设备" value="1"></el-option>
                    </el-select>
                    
                </el-form-item>

                <el-form-item prop="devices" v-if="form.select_device_flag==='1'">
                    <el-input readonly placeholder="点这里选择设备" v-model="deviceListStr"
                        @click.native="selectDeviceDialogVisible=true"></el-input>
                    <select-device :visible.sync="selectDeviceDialogVisible" :data="data" @change="changeSelectionDevie"></select-device>
                </el-form-item>
            
                <el-form-item :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARE_LIST_ADD.DESCRIPTION')"
                    prop="description">
                    <el-input type="textarea" v-model="form.description"></el-input>
                </el-form-item>

                <div class="text-right">
                    <el-button type="border" @click="dialogVisible=false">{{$t('COMMON.CANCEL') }}</el-button>
                    <el-button type="primary"  @click="onSubmit">{{$t('COMMON.CONFIRM') }}</el-button>

                </div>
                
            </el-form>
        </el-dialog>
    </div>
</template>
<script>
import SelectDevice from './SelectDevice.vue';
import OTAAPI from "@/api/ota";
import { message_success } from '@/utils/helpers';
export default {
    name: 'AddTask',
    components: { SelectDevice},
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
            form: {
                task_name: "",
                upgrade_time_type: "0",
                select_device_flag: "0",
                start_time: "",
                device: [],
                description: ""
            },
            rules: {
                task_name: [{required: true, message: '请输入任务名称', trigger: 'blur'}],
                upgrade_time_type: [{required: true, message: '请选择升级时间', trigger: 'blur'}],
                select_device_flag: [{required: true, message: '请选择设备', trigger: 'blur'}]
            },
            selectDeviceDialogVisible: false,
            deviceList: [],
            deviceListStr: ""
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
    watch: {
        dialogVisible: {
            handler(newValue) {
                if (newValue) {
                    this.form =  {
                        task_name: "",
                        upgrade_time_type: "0",
                        select_device_flag: "0",
                        start_time: "",
                        device: [],
                        description: ""
                    }
                }
            }
        }
    },
    methods: {
        changeSelectionDevie(val) {
            this.deviceList = val.map(item => item.id);
            this.deviceListStr = val.map(item => item.name).join(",")
        },
        onSubmit() {
            this.$refs.addTaskForm.validate(valid => {
                if (valid) {
                    const { otaId, productId } = this.$route.query;
                    let data = {
                        ota_id: otaId, 
                        product_id: productId, 
                        device_id_list: this.deviceList, 
                        end_time: this.form.start_time,
                        ...this.form 
                    }
                    OTAAPI.taskAdd(data)
                        .then(({ data: result }) => {
                            console.log(result)
                            if (result.code === 200) {
                                message_success("添加成功！");
                                this.dialogVisible = false;
                                this.$emit("submit");
                            }
                        })
                }
            })
            
        }
    },
};
</script>
<style  scoped>
    
</style>