<template>
    <div style="margin: 20px 0">
        <el-form ref="configForm" :model="formData" :rules="formRules" label-width="260px" >
            <el-form-item v-for="(attr, index) in attrs" :key="index" :label="attr.label" :prop="attr.dataKey">
                
                <el-input style="width: 80%" v-if="attr.type === 'input' && attr.validate.type !== 'number'"
                    v-model="formData[attr.dataKey]" :placeholder="attr.placeholder"></el-input>

                <el-input-number style="width: 80%" v-else-if="attr.type === 'input' && attr.validate.type === 'number'"
                    v-model="formData[attr.dataKey]" :placeholder="attr.placeholder"></el-input-number>

                <el-select style="width: 80%" v-else-if="attr.type === 'select'" v-model="formData[attr.dataKey]">
                    <el-option v-for="(option, index) in attr.options" :key="index" :label="option.label"
                        :value="option.value"></el-option>
                </el-select>

                <el-button type="save" size="medium" v-if="attr.type === 'table'" @click="handleShowTableDialog(attr)">{{ attr.label }}</el-button>
                
            </el-form-item>
        </el-form>
       
        <data-parse-table :visible.sync="dialogVisible" :attrs="currentTableAttr" :data.sync="currentTableData" @submit="handleTableSubmit"></data-parse-table>
    </div>
</template>

<script>
import DataParseTable from './DataParseTable.vue';

export default {
    components: { DataParseTable },
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
            dialogVisible: false,
            currentTableAttr: {},
            currentTableData: []
        }
    },
    computed: {
        formRules: {
            get() {
                let rules = {};
                this.attrs.forEach(attr => {
                    if (attr.type !== "table") {
                        rules[attr.dataKey] = [attr.validate]
                        if (attr.validate.rules) {
                            let trimmedRegexString = attr.validate.rules.slice(1, -1);
                            let reg = new RegExp(trimmedRegexString)
                            rules[attr.dataKey].push({
                                pattern: reg, 
                                message: attr.validate.message, 
                                trigger: 'blur'
                            })
                        }
                        
                    }
                })
                return rules;
            }
        },
        formData: {
            get() {
                console.log("computed.data", JSON.stringify(this.data))
                if (this.data && JSON.stringify(this.data) !== "{}") {
                    return this.data
                } else {
                    let obj = {};
                    this.attrs.forEach(attr => {
                        console.log("computed.forEach.attr", attr)
                        if (attr.type === "input") {
                            // 输入框
                            obj[attr.dataKey] = attr.validate.type === "number" ? 0 : "";
                        } else if (attr.type === "table") {
                            // 表格
                            obj[attr.dataKey] = [];
                        }
                    })
                    console.log("computed.obj", obj)
                    return obj;
                }
            }
        }
    },
    watch: {
        formData: {
            handler(val) {
                console.log("watch.formData", val)
                if (JSON.stringify(val) !== JSON.stringify(this.data)){
                    this.$emit('update:data', val)
                }
            },
            deep: true,
            immediate: true
        }
    },
    methods: {
        handleShowTableDialog(attr) {
            console.log("handleShowTableDialog", attr)
            this.currentTableAttr = attr;
            this.currentTableData = this.formData[attr.dataKey];
            this.dialogVisible = true;
        },
        handleTableSubmit(data) {
            console.log("handleTableSubmit", data)
            this.formData[this.currentTableAttr.dataKey] = data;
        },
        validate(cb) {
            console.log("this.$refs.tableRef", this.$refs.tableRef)
            console.log("dataparse.formData", this.formData)
            try {
                this.$refs.configForm.validate(valid => {
                    if (!valid) {
                        throw new Error("");
                    }
                });
                cb(true);
            } catch (err) {
                console.log(err)
                cb(false);
            }
        }
    }
}
</script>
<style lang="scss" scoped>


::v-deep .el-form-item {
    margin-bottom: 0px;
}

</style>