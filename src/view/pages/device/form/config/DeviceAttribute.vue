<template>
    <div style="margin-top: 20px">
        <el-form label-position="left" :model="formData" label-width="100px">
            <el-form-item :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.SUBDEVICEADDRESS')" v-if="device.device_type == '3'">
                <el-input style="width: 100%" :placeholder="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.PLACEHOLDER1')"
                    v-model="formData.subDeviceAddress"></el-input>
            </el-form-item>

            <el-form-item v-if="device.device_type == '2' && device.protocol.startsWith('WVP_')"
                :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.LABLE1')">
                <el-select style="width: 100%" v-model="formData.d_id">
                    <el-option v-for="(item, index) in wvpDevice" :key="item.deviceId"
                        :label="item.deviceId + ' [' + item.createTime + '] ' + (item.online == 1 ? $t('DEVICE_MANAGEMENT.DEVICE_CONFIG.ONLINE') : $t('DEVICE_MANAGEMENT.DEVICE_CONFIG.OFFLINE'))"
                        :value="item.deviceId"></el-option>
                </el-select>
            </el-form-item>

            <el-form-item :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.DEVICELOCATION')">
                <el-input readonly @click.native="showCheckLocation" style="width: 100%"
                    :placeholder="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.PLACEHOLDER2')"
                    v-model="formData.location"></el-input>
            </el-form-item>
        </el-form>
      <device-location-config v-if="positionShow" :maker-position.sync="locationArray" :dialog-visible.sync="positionShow"></device-location-config>

      <el-form>
        <el-form-item label="固件版本">
            {{ device.additional_info.version || '' }}
        </el-form-item>
      </el-form>
    </div>
</template>

<script>
import DeviceLocationConfig from "@/components/common/DeviceLocationConfig.vue"

export default {
    components: {
        DeviceLocationConfig
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
            default: () => {return {}}
        },
        wvpDevice: {
            type: Array,
            default: () => {return []}
        }
    },
    data() {
        return {
            positionShow: false,
            locationArray: [],
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
    watch: {
        locationArray(val) {
            this.formData.location = val.join(',')
        }
    },
    mounted() {
        console.log("DeviceAttribute", this.device)
    },
    methods: {
        showCheckLocation() {
            this.positionShow = true
        },
    }
}
</script>
<style lang="scss" scoped>
.el-form-item__content {
    margin-left: 100px;
}
</style>