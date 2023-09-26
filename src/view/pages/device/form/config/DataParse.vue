<template>
    <div>
        <el-form ref="configForm" :model="formData" :rules="formRules" label-width="260px">
            <el-form-item v-for="(attr, index) in formAttrs" :key="index" :label="attr.label" :prop="attr.dataKey">

                <el-input style="width: 80%" v-if="attr.type === 'input' && attr.validate.type !== 'number'"
                    v-model="formData[attr.dataKey]" :placeholder="attr.placeholder"></el-input>

                <el-input-number style="width: 80%" v-else-if="attr.type === 'input' && attr.validate.type === 'number'"
                    v-model="formData[attr.dataKey]" :placeholder="attr.placeholder"></el-input-number>

                <el-select style="width: 80%" v-else-if="attr.type === 'select'" v-model="formData[attr.dataKey]">
                    <el-option v-for="(option, index) in attr.options" :key="index" :label="option.label"
                        :value="option.value"></el-option>
                </el-select>

                <el-table style="width: 80%" v-if="attr.type === 'table'" :data.sync="formData[attr.dataKey]">
                    <!-- 内容列 start -->
                    <el-table-column v-for="(item, index) in attr.array" 
                        :key="index" 
                        :prop="item.dataKey" 
                        :label="item.label"
                        width="140">
                        <template slot-scope="scope">
                            
                            <el-form ref="tableRef" :model="scope.row" :rules="item.rules" :error="item.validate.message">
                                <el-form-item :prop="item.dataKey">
                                    <template v-if="item.type==='input'">
                                        <el-input-number size="small" v-if="item.validate.type==='number'" 
                                            v-model="scope.row[item.dataKey]" :placeholder="item.placeholder"/>

                                        <el-input size="small" v-else
                                            v-model="scope.row[item.dataKey]" :placeholder="item.placeholder"/>
                                        <span slot="error" class="el-form-input_tip el-form-item__error">
                                            {{item.validate.message}}
                                        </span>
                                    </template> 
                                    
                                    <template v-else-if="item.type==='select'">
                                        <el-select size="small" v-model="scope.row[item.dataKey]" :placeholder="item.placeholder">
                                            <el-option v-for="(option, index) in item.options" :key="index" 
                                                :label="option.label" :value="option.value"/>
                                        </el-select>
                                        <span slot="error" class="el-form-input_tip el-form-item__error">
                                            {{item.validate.message}}
                                        </span>
                                    </template>
                                </el-form-item>
                            </el-form>
                        </template>
                    </el-table-column>
                    <!-- 内容列 end -->

                    <!-- 操作列 start -->
                    <el-table-column prop="handle" label="操作" width="100" align="right">
                        <!-- 操作列表头 -->
                        <template slot="header" slot-scope="scope">
                            <el-button size="small" @click="handleAdd(attr)">新增</el-button>
                        </template>
                        <!-- 操作列内容 -->
                        <template slot-scope="scope">
                            <!-- <el-button size="mini" @click="handleEdit(attr, scope.$index, scope.row)">编辑</el-button> -->
                            <el-button size="mini" @click="handleDel(attr, scope.$index, scope.row)">删除</el-button></el-button>
                        </template>
                    </el-table-column>
                    <!-- 操作列 end -->

                </el-table>
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
            // formData: {},
            formAttr: [],
            formRule: {}
        }
    },
    computed: {
        formAttrs: {
            get() {
                let attrs = JSON.parse(JSON.stringify(this.attrs));
                attrs.forEach(attr => {
                    if (!attr.array) {
                        attr.rules = {};
                        attr.rules[attr.dataKey] = [attr.validate];
                    } else {
                        attr.array.forEach(tableAttr => {
                            tableAttr.rules = {};
                            tableAttr.rules[tableAttr.dataKey] = [tableAttr.validate];
                        })
                    }
                })
                return attrs;
            }
        },
        formRules: {
            get() {
                let rules = {};
                this.attrs.forEach(attr => {
                    if (attr.type !== "table") {
                        rules[attr.dataKey] = [attr.validate]
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
    mounted() {
        console.log("DataParse.attrs", this.attrs)
        this.formRule = this.getFormRule(this.attrs);
        // this.getFormRule(this.attrs);
        console.log("DataParse.formRule", this.formRule)

    },
    methods: {
        getFormRule(formAttr) {
            console.log("getFormRule.formAttr", formAttr)
            let rules = {};
            formAttr.forEach(attr => {
                if (!attr.array) {
                    rules[attr.dataKey] = [attr.validate]
                }
            })
            return rules;
        },
        handleAdd(attr) {
            console.log("handleAdd1", this.formData, attr)
            // 根据attr.array生成一行数据
            let newLine = {};
            let obj = {};
            attr.array.forEach(item => {
                obj[item.dataKey] = "";
            })
            this.formData[attr.dataKey].push(obj)
            console.log("handleAdd2", this.formData)
            
        },
        handleEdit(attr,index, item) {
            console.log("handleEdit", attr, index, item)
        },
        handleDel(attr,index, item) {
            this.formData[attr.dataKey].splice(index, 1)
            console.log("handleDel", index, this.formData)

        },
        validate(cb) {
            console.log("this.$refs.tableRef", this.$refs.tableRef)
            try {
                this.$refs.configForm.validate(valid => {
                    if (!valid) {
                        throw new Error("");
                    }
                });
                if (!this.$refs.tableRef || this.$refs.tableRef.length === 0) {
                    throw new Error("");
                }
                for (let i = 0; i < this.$refs.tableRef.length; i++) {
                    const ref = this.$refs.tableRef[i];
                    ref.validate(valid => {
                        if (!valid) {
                            throw new Error("");
                        }
                    })
                }
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
.el-table--fit {
    border-right: 1px solid #344a9a;
    border-bottom: 0;
    border-left: 1px solid #344a9a;
}
::v-deep .el-table .el-table__cell {
    padding-top: 0px;
}
::v-deep .el-form-item__content {
    line-height: 66px;
}
::v-deep .el-form-item__error {
    // position:static!important;
    color: #F56C6C!important;
    padding: 0px!important;
    top: 56px;
    left: 4px;
}
</style>