<template>
    <div>
        <div style="margin-top: 20px">
            <el-form label-position="left" :model="formData" label-width="120px">

                <el-form-item :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.FIRMWARE_VERSION')">
                    {{ device.current_version || '' }}
                </el-form-item>
            </el-form>
        </div>

    </div>
</template>

<script>

export default {
    name: "DevicePlugin",
    components: {
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
            dialogVisible: false,
            deviceHistoryVisible: false,
            deviceDataChartVisible: false,
            attributeName: "",
            deliveryAttribute: "",
            attributeList: [],
            tableData: [],
            attributeLoading: false,
            logLoading: false,
            logTotal: 0,
            params: {
                device_id: this.device.id,
                business_name: "",
                per_page: 10,
                current_page: 1,
                asset_name: "",
                operation_type: "",
                send_result: "",
            },
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
    },
    mounted() {
        console.log("DevicePlugin", this.device)
    },
    methods: {
    }
}
</script>
<style lang="scss" scoped></style>