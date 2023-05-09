<template>
    <div>
        <el-form ref="configForm" :model="formData" :rules="formRule" label-width="260px">
            <el-form-item v-for="(attr, index) in attrs" :key="index" :label="attr.label" :prop="attr.dataKey">

                <el-input style="width: 80%" v-if="attr.type == 'input' && attr.validate.type != 'number'"
                    v-model="formData[attr.dataKey]" :placeholder="attr.placeholder"></el-input>

                <el-input-number style="width: 80%" v-if="attr.type == 'input' && attr.validate.type == 'number'"
                    v-model="formData[attr.dataKey]" :placeholder="attr.placeholder"></el-input-number>

                <el-select style="width: 80%" v-if="attr.type == 'select'" v-model="formData[attr.dataKey]">
                    <el-option v-for="(option, index) in attr.options" :key="index" :label="option.label"
                        :value="option.value"></el-option>
                </el-select>
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
        },
        attrs: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            formAttr: [],
            formRule: {}
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
        this.formRule = this.getFormRule(this.attrs);
    },
    methods: {
        getFormRule(formAttr) {
            let rules = {};
            formAttr.forEach(attr => {
                let rule = {};
                rule.required = attr.validate.required;
                rule.message = attr.validate.message;
                if (attr.validate.type) {
                    rule.type = attr.validate.type;
                }
                rules[attr.dataKey] = [rule]
            })
            return rules;
        },
        validate(cb) {
            this.$refs.configForm.validate(valid => {
                cb(valid)
            });
        }
    }
}
</script>
<style lang="scss" scoped></style>