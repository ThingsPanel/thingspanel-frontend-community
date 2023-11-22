
<template>
    <div>
        <el-form label-position="left" :model="formData" label-width="120px">
            <el-form-item :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.OFFLINETIME')" prop="thresholdTime">
                <el-input-number controls-position="right" size="small" v-model="formData.thresholdTime"
                    :min="0"></el-input-number>
                秒
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
    methods: {
        showCheckLocation() {
            this.positionShow = true
        }

    }
}
</script>
<style lang="scss" scoped></style>