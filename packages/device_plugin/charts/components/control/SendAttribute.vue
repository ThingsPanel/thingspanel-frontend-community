<!-- 属性下发 -->
<template>
    <div class="switch-container">
        <div class="center">
            <el-button type="danger" round @click="handleClick">
                <i class="el-icon-send-attribute" style="width:100%;height:100%" />
            </el-button>
        </div>

        <el-dialog class="dark-dialog" :title="$t('PLUGIN.CHART_INFO_TAB.TEXT1')" width="500px"
            :visible.sync="dialogVisible" :append-to-body="true" :close-on-click-modal="false">
            <el-form ref="formRef" :model="optionData" :label-position="'left'">
                <el-form-item :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE3')">
                    <el-input v-model="optionData.name"></el-input>
                </el-form-item>

                <el-form-item label="属性标识符">
                    <el-input v-model="optionData.identifier"></el-input>
                </el-form-item>

                <el-form-item label="参数类型">
                    <el-radio v-model="optionData.dataType" label="string">字符串</el-radio>
                    <el-radio v-model="optionData.dataType" label="number">数值</el-radio>
                </el-form-item>

                <el-form-item label="参数">
                    <el-input type="textarea" :rows="4" v-model="optionData.params"></el-input>
                </el-form-item>

            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="dialogVisible = false">{{ $t('PLUGIN.CHART_INFO_TAB.CANCEL') }}</el-button>
                <el-button type="primary" @click="submit">{{ $t('PLUGIN.CHART_INFO_TAB.CONFIRM') }}</el-button>
            </span>
        </el-dialog>
    </div>
</template>
  
<script>
import { message_error } from "@/utils/helpers.js"
export default {
    name: "SendAttribute",
    props: {
        mode: {
            type: String,
            default: ""
        },
        // 数据
        option: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            dialogVisible: false,
            optionData: {
                name: "",
                identifier: "",
                dataType: "string",
                params: ""
            },
            isSending: false
        }
    },
    methods: {
        showDialog(option) {
            console.log("showDialog", option)
            if (this.mode != "edit") return;
            if (option) {
                this.optionData = { ...option };
            }
            this.dialogVisible = true;
        },
        handleClick() {
            if (this.mode === "edit") return;
            if (this.isSending) {
                message_error("属性下发不能太频繁")
                return;
            }
            this.$emit("send", () => {
                this.isSending = false
                console.log("发送成功")
            });
            this.isSending = true;
        },
        submit() {
            if (!this.validate()) return;
            this.$emit("bind", this.optionData);
            this.dialogVisible = false;
        },
        validate() {
            let { name, identifier, dataType, params } = this.optionData;
            console.log(name, identifier, dataType, params )
            try {
                if (!name) throw new Error("组件名称不能为空");
                if (!identifier) throw new Error("属性标识符不能为空");
                if (!dataType) throw new Error("参数类型不能为空");
                if (!params) throw new Error("参数不能为空");
                return true;
            } catch (err) {
                message_error(err.message);
                return false;
            }
            
        }
    }
}
</script>
  
<style scoped lang="scss">
.el-button--danger {
    width: 80px;
    height: 60px;
}

.el-icon-send-attribute {
    background: url('~@/assets/images/send_attribute.svg') center center no-repeat;
}

.el-icon-send-attribute:before {
    content: '替';
    visibility: hidden;
}

.switch-container {
    width: 100%;
    height: 100%;
    display: table;
    position: absolute;
    top: 0px;

    .center {
        display: table-cell;
        vertical-align: middle;
        text-align: center;
        padding: 20px !important;

        p {
            margin: 10px;
        }

    }
}
</style>