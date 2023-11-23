
<template>
    <div>
        <el-form label-position="left" :model="formData" label-width="140px">
            <el-form-item :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.OFFLINETIME')" prop="thresholdTime">
                <el-input-number controls-position="right" size="small" v-model="formData.thresholdTime"
                    :min="0"></el-input-number>
                秒
            </el-form-item>

            <el-form-item label="手动调节设备状态" prop="deviceState">
                <el-switch v-model="formData.deviceState" :active-text="formData.deviceState ==='1' ? '在线' : '离线'"
                    active-value="1" inactive-value="0"
                    @change="onDeviceStateChange"></el-switch>
                <div style="color: #78a7cc">离线时间阈值为0时手动调节生效</div>
            </el-form-item>

            <el-form-item :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.SUBDEVICEADDRESS')" v-if="device.device_type == '3'">
                <el-input style="width: 100%" :placeholder="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.PLACEHOLDER1')"
                    v-model="formData.subDeviceAddress"></el-input>
            </el-form-item>

            <el-form-item :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.DEVICELOCATION')">
                <div style="display: flex" >
                    <el-input style="width: 100%;float:left" :placeholder="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.PLACEHOLDER2')"
                        v-model="formData.location"></el-input>
                    <el-button style="float:right" size="medium" icon="el-icon-location-outline" type="border"
                        @click.native="showCheckLocation">定位</el-button>    
                </div>
                
            </el-form-item>
        </el-form>
            <device-location-config v-if="positionShow" :maker-position.sync="locationArray"
                :dialog-visible.sync="positionShow"/>

    </div>
</template>

<script>
import DeviceLocationConfig from "@/components/common/DeviceLocationConfig.vue"
import { getDeviceListStatus, setDeviceStatus } from "@/api/device.js"

export default {
    components: {
        DeviceLocationConfig,
    },
    props: {
        data: {
            type: Object,
            default: () => {
                return {}
            }
        },
        device: {
            type: [Object],
            default: () => { return {} }
        },
    },
    data() {
        return {
            positionShow: false,
            locationArray: [],

        }
    },
    watch:{
        locationArray(val) {
            this.formData.location = val.join(',')
        }
    },
    computed: {
        formData: {
            get() {
                return this.data
            },
            set(val) {
                this.$emit('update:data', val)
            }
        }
    },
    mounted() {
        // 初始化设备状态
        this.getDeviceState();
    },
    methods: {
        showCheckLocation() {
            this.positionShow = true
        },
        /**
         * @description: 获取设备状态
         * @return {*}
         */        
        getDeviceState() {
            getDeviceListStatus({ device_id_list: [this.device.id] })
                .then(({ data: result }) => {
                    if (result.code === 200) {
                        this.formData.deviceState = result.data[this.device.id];
                    }
                })
        },
        /**
         * @description: 手动设置设备当前状态
         * @param {*} v
         * @return {*}
         */        
        onDeviceStateChange(v) {
            setDeviceStatus({ id: this.device.id, status: v })
                .then(({ data: result }) => {
                    console.log("setDeviceStatus", result)
                })
        }
    }
}
</script>
<style lang="scss" scoped>
::v-deep .el-switch__label {
    color: #949393;
}
::v-deep .el-switch__label.is-active {
    color: #0af144;
}
</style>