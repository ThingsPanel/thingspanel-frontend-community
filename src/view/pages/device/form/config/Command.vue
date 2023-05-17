<template>
    <div>
        <div style="justify-content: space-between;display: flex;margin-bottom: 10px">
            <el-button type="border" size="medium" @click="commandDialogVisible=true">下发命令</el-button>
            <el-button type="border" size="medium" @click="getList">刷新</el-button>
        </div>
        <el-table :data="tableData" v-loading="loading">
            <el-table-column label="命令标识符" prop="trigger_time" width="240"></el-table-column>
            <el-table-column label="命令名称" prop="process_description" width="auto"></el-table-column>
            <el-table-column label="命令内容" prop="process_description" width="auto"></el-table-column>
            <el-table-column label="命令下发时间" prop="process_description" width="auto"></el-table-column>

            <el-table-column label="状态" prop="process_result" width="100">
                <template v-slot="scope">
                    {{ scope.row.process_result == '1' ? $t('AUTOMATION.SUCEESSFUL') : $t('AUTOMATION.FAILURE') }}
                </template>
            </el-table-column>
            <el-table-column label="状态描述" prop="process_description" width="auto"></el-table-column>

        </el-table>
        <!-- 表 end -->

        <div class="text-right py-3">
            <el-pagination background layout="prev, pager, next" :total="total" :current-page.sync="params.current_page"
                :page-size="params.per_page" @current-change="getList"></el-pagination>
        </div>

        <el-dialog  title="下发命令" :append-to-body="true" :visible.sync="commandDialogVisible" width="30%" :before-close="handleClose">
            <el-form label-position="left" :model="commandFormData" label-width="100px">
                <el-form-item label="命令标识符" prop="commandId">
                    <el-select v-model="commandFormData.commandId">
                        <el-option v-for="(command, index) in commands" :key="index" :label="command.label" :value="command.value">
                            <span style="float: left">{{ command.label }}</span>
                            <span style="float: right; color: #8492a6; font-size: 13px">{{ command.value }}</span>
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="命令内容" prop="commandContent">
                    <el-input type="textarea" :rows="6"></el-input>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button type="cancel" @click="handleClose">取消</el-button>
                <el-button type="save" @click="handleSendCommand">发送</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
export default {
    components: {},
    props: {},
    data() {
        return {
            loading: false,
            tableData: [],
            total: 0,
            params: {
                current_page: 1,
                per_page: 10
            },
            commandDialogVisible: false,
            commandFormData: {},
            commands: [
                {
                    label: '重启设备',
                    value: 'restart'
                },
                {
                    label: '开启',
                    value: 'start'
                }
            ]
        }
    },
    methods: {
        getList() {

        },
        handleSendCommand() {

        },
        handleClose() {
            this.commandDialogVisible = false;
        }
    }
}
</script>
<style lang="scss" scoped></style>