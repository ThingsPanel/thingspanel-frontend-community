<template>
    <div>
        <el-form label-position="left" :model="formData">
            <el-form-item :label="$t('DEVICE_MANAGEMENT.DEVICE_CONFIG.OFFLINETIME')" prop="thresholdTime">
                <el-input-number controls-position="right" size="small" v-model="formData.thresholdTime"
                    :min="5"></el-input-number>
                秒
            </el-form-item>
        </el-form>
    </div>
</template>

<script>
export default {
    components: {},
    props: {
        data: {
            type: Object,
            default: () => {
                return {}
            }
        }
    },
    data() {
        return {
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
    methods: {}
}
</script>
<style lang="scss" scoped></style>