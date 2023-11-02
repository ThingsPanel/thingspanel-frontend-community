<template>
    <el-dialog class="el-dark-dialog el-dark-input" title="配置" width="80%"
        :close-on-click-modal="false" :close-on-press-escape="false" :append-to-body="true" :visible.sync="dialogVisible"
        @close="dialogVisible = false">

        <el-table :data.sync="tableData">
            <!-- 内容列 start -->
            <el-table-column v-for="(item, index) in tableAttrs.array" :key="index" :prop="item.dataKey"
                :label="item.label" width="auto">
                <template slot-scope="scope">

                    <!-- <el-form ref="tableRef" :model="scope.row" :rules="item.rules" :error="item.validate.message"> -->
                    <el-form ref="tableRef" :model="scope.row" :rules="item.rules">
                        <el-form-item :prop="item.dataKey">
                            <template v-if="item.type === 'input'">
                                <el-tooltip class="item" effect="dark" :content="item.placeholder" placement="top-start">
                                    <el-input-number size="small" v-if="item.validate.type === 'number'"
                                        v-model="scope.row[item.dataKey]" :placeholder="item.placeholder" />

                                    <el-input size="small" v-else v-model="scope.row[item.dataKey]"
                                        :placeholder="item.placeholder" />
                                </el-tooltip>
                                <!-- <span slot="error" class="el-form-input_tip el-form-item__error">
                                    {{ item.validate.message }}
                                </span> -->
                            </template>

                            <template v-else-if="item.type === 'select'">
                                <el-tooltip class="item" effect="dark" :content="item.placeholder" placement="top-start">
                                    <el-select size="small" v-model="scope.row[item.dataKey]" :placeholder="item.placeholder">
                                        <el-option v-for="(option, index) in item.options" :key="index" :label="option.label"
                                            :value="option.value" />
                                    </el-select>
                                </el-tooltip>
                                <span slot="error" class="el-form-input_tip el-form-item__error">
                                    {{ item.validate.message }}
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
                    <el-button type="save" size="small" @click="handleAdd">新增</el-button>
                </template>
                <!-- 操作列内容 -->
                <template slot-scope="scope">
                    <!-- <el-button size="mini" @click="handleEdit(scope.$index, scope.row)">编辑</el-button> -->
                    <el-button type="danger" size="mini" @click="handleDel(scope.$index, scope.row)">删除</el-button>
                </template>
            </el-table-column>
            <!-- 操作列 end -->

        </el-table>

        <span slot="footer" class="dialog-footer">
            <el-button type="cancel" @click="dialogVisible = false">{{ $t('DEVICE_MANAGEMENT.DEVICE_CONFIG.CANCEL')
            }}</el-button>
            <el-button type="save" @click="handleSubmit(tableData)">{{ $t('DEVICE_MANAGEMENT.DEVICE_CONFIG.CONFIRM')
            }}</el-button>
        </span>
    </el-dialog>
</template>

<script>
export default {
    components: {},
    props: {
        visible: {
            type: [Boolean],
            default: false
        },
        attrs: {
            type: [Object],
            default: () => ({})
        },
        data: {
            type: [Array],
            default: () => ([])
        }
    },
    data() {
        return {
        }
    },
    computed: {
        dialogVisible: {
            get() {
                return this.visible;
            },
            set(val) {
                this.$emit("update:visible", val);
            }
        },
        tableAttrs: {
            get() {
                let attrs = JSON.parse(JSON.stringify(this.attrs));
                attrs.array && attrs.array.forEach(item => {
                    item.rules = {};
                    item.rules[item.dataKey] = [ item.validate ];
                    if (item.validate.rules) {
                        let trimmedRegexString = item.validate.rules.slice(1, -1);
                        let reg = new RegExp(trimmedRegexString)
                        item.rules[item.dataKey].push(
                            { 
                                pattern: reg, 
                                message: item.validate.message, 
                                trigger: 'blur'
                            })
                    }
                })
                console.log("attrs", attrs)
                return attrs;
                
            }
        },
        tableData: {
            get() {
                return JSON.parse(JSON.stringify(this.data));
            }
        }
    },
    methods: {
        /**
         * 添加一行
         */
        handleAdd() {
            // 根据attr.array生成一行数据
            let newLine = {};
            this.attrs.array.forEach(item => {
                newLine[item.dataKey] = "";
            })
            this.tableData.push(newLine)
        },
        handleEdit(attr,index, item) {
            console.log("handleEdit", attr, index, item)
        },
        /**
         * 删除一行
         */
        handleDel(index, item) {
            console.log("handleDel", index, this.tableData, this.attrs.dataKey)
            // this.tableData[this.attrs.dataKey].splice(index, 1)
            this.tableData.splice(index, 1)

        },
        /**
         * 提交
         */
        handleSubmit(data) {
            
            try {
                let valid = true;
                for (let i = 0; i < this.$refs.tableRef.length; i++) {
                    this.$refs.tableRef[i].validate(valid => {
                        if (!valid) {
                            valid = false;
                            throw new Error("");
                        }
                    })
                }
                if (valid) {
                    console.log("handleSubmit1", this.tableData)
                    // this.$emit("update:data", this.tableData)
                    this.$emit("submit", JSON.parse(JSON.stringify(this.tableData)))
                    this.dialogVisible = false;
                }
            } catch(err) {}
        },
    }
}
</script>
<style lang="scss" scoped>
.el-table--fit {
    border-right: 1px solid #344a9a;
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
    top: calc(100% - 14px)!important;
    left: 0px;
    width: 100%;
}
</style>