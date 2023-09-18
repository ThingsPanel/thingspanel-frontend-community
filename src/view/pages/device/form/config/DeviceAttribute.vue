<template>
    <div style="margin-top: 20px">
        <el-form label-position="left" :model="formData" label-width="120px">
            <div v-if="device.device_type !== '2'" style="margin-bottom: 30px;">
                <div style="margin-bottom: 20px;">
                    <h1>{{ $t('DEVICE_MANAGEMENT.DEVICE_CONFIG.CURRENT_PROPERTIES') }}</h1>
                </div>

                <!-- 属性卡片 -->
                <el-row :gutter=12>
                    <!-- <el-tab-pane v-for="item in tabList" :key="item.value" :label="item.label" :name="item.value"></el-tab-pane>
                    </el-tab-pane> -->

                    <el-col :span=6 style="margin-bottom: 10px;" v-for="item in attributeCard" :key="item.key"
                        v-if="item.key !== 'systime' && item.key !== 'SYS_ONLINE'">
                        <div style="height 150px; background-color: #2d3d88; border-radius: 4px;border: 1px solid #EBEEF5;">
                            <div style="padding: 10px 10px 10px 20px; height: 30px;">
                                <span style="font-size: 18px;">{{ item.name }}</span>
                                <el-tooltip class="item" effect="dark"
                                    :content="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.CHECK_TIMING_CHART')"
                                    placement="top-start">
                                    <i v-if="isShowDataChart(item)" @click="showDeviceDataChart(item)"
                                        style="float: right; padding: 3px 5px; cursor:pointer;"
                                        class="el-icon-pie-chart"></i>
                                    <i v-else 
                                        style="float: right; padding: 3px 5px; cursor:not-allowed;"
                                        class="el-icon-pie-chart"></i>
                                </el-tooltip>
                                <el-tooltip class="item" effect="dark"
                                    :content="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.CHECK_HISTORY_DATA')"
                                    placement="top-start">
                                    <i @click="showDeviceHistory(item)"
                                        style="float: right; padding: 3px 5px; cursor:pointer;"
                                        class="el-icon-notebook-2"></i>
                                </el-tooltip>
                            </div>
                            <div style="height: 3px !important;">
                                <hr style="border-top: 1px solid rgb(255 255 255 / 99%);" />
                            </div>
                            <div style="height:115px; padding:10px 5px 0px 10px">
                                <div style="height: 63px;">
                                    <span style="font-size: 50px; padding-left:10px">{{ item.str_v ? item.str_v : item.dbl_v
                                    }}</span>
                                    <!-- <span style="font-size: 50px; ">°</span> -->
                                </div>
                                <div style="float: right; padding: 3px 5px; margin-bottom: 3px; margin-top: 11px">{{
                                    calculateUpdateTime(item.ts) }}</div>
                            </div>
                        </div>
                    </el-col>
                </el-row>
            </div>

            <div v-if="device.device_type !== '2'" style="margin-bottom: 20px;">
                <h1>{{ $t('DEVICE_MANAGEMENT.DEVICE_CONFIG.OTHER_PROPERTIES') }}</h1>
            </div>

            <el-form-item :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.DEVICE_ID')">
                <el-tooltip effect="dark"
                    :content="isCopy ? $t('DEVICE_MANAGEMENT.EDIT_PARAMETER.COPIED') : $t('DEVICE_MANAGEMENT.EDIT_PARAMETER.COPY')">
                    <el-input style="width: 100%" readonly v-clipboard:copy="device.device" v-model="device.device"
                        @click.native="handleCopy"></el-input>
                </el-tooltip>

            </el-form-item>

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
        <device-location-config v-if="positionShow" :maker-position.sync="locationArray"
            :dialog-visible.sync="positionShow"></device-location-config>

        <el-form>
            <el-form-item :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.FIRMWARE_VERSION')">
                {{ device.current_version || '' }}
            </el-form-item>
        </el-form>

        <!-- 属性历史数据 -->
        <DeviceHistory :visible.sync="deviceHistoryVisible" :device="device" :attributeName="choosedAttribute">
        </DeviceHistory>
        <!-- 属性时序图表 -->
        <DeviceDataChart :visible.sync="deviceDataChartVisible" :device="device" :attributeName="choosedAttribute">
        </DeviceDataChart>
    </div>
</template>

<script>
import DeviceLocationConfig from "@/components/common/DeviceLocationConfig.vue"
import DeviceHistory from "./DeviceHistory.vue"
import DeviceDataChart from "./DeviceDataChart.vue"
import i18n from "@/core/plugins/vue-i18n.js"

export default {
    components: {
        DeviceLocationConfig,
        DeviceHistory,
        DeviceDataChart,
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
        wvpDevice: {
            type: Array,
            default: () => { return [] }
        },
        attributeCard: {
            type: Array,
            default: () => { return [] }
        }
    },
    data() {
        return {
            positionShow: false,
            locationArray: [],
            isCopy: false,
            choosedAttribute: "",
            deviceHistoryVisible: false,
            deviceDataChartVisible: false,
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
        handleCopy() {
            this.isCopy = true;
        },
        showDeviceHistory(item) {
            this.choosedAttribute = item.key;
            this.deviceHistoryVisible = true;

        },
        showDeviceDataChart(item) {
            this.choosedAttribute = item.key;
            this.deviceDataChartVisible = true;
        },
        calculateUpdateTime(timestamp) {
            const lang = i18n.t('COMMON.CURRENT_LANGUAGE');
            const now = Date.now();
            const timeDiff = now - parseInt(timestamp / 1000);

            if (timeDiff < 0) {
                return "";
            }

            const seconds = Math.floor(timeDiff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            const weeks = Math.floor(days / 7);
            const months = Math.floor(days / 30);
            const years = Math.floor(days / 365);

            const timeUnitsCn = ['年', '个月', '周', '天', '小时', '分钟', '秒'];
            const timeUnitsEn = ['year(s)', 'month(s)', 'week(s)', 'day(s)', 'hour(s)', 'minute(s)', 'second(s)'];
            const timeUnits = lang === '中文' ? timeUnitsCn : timeUnitsEn;

            const timeValues = [years, months, weeks, days, hours, minutes, seconds];

            for (let i = 0; i < timeValues.length; i++) {
                if (timeValues[i] > 0) {
                    return lang === '中文' ? `${timeValues[i]}${timeUnits[i]}前更新` : `Updated ${timeValues[i]} ${timeUnits[i]} ago`;
                }
            }

            return lang === '中文' ? "刚刚更新" : "Just updated";
        },
        isShowDataChart(item){
            if (!item) {
                return false
            }
            let value = item.str_v ? item.str_v : item.dbl_v
            if(!value || typeof value === "number"){
                return true
            }
            return false
        },
    }
}
</script>
<style lang="scss" scoped>.el-form-item__content {
    margin-left: 100px;
}</style>