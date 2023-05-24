<template>
    <div>
        <div style="justify-content: space-between;display: flex;margin-bottom: 10px">
            <el-button type="border" size="medium" @click="commandDialogVisible=true">下发命令</el-button>
            <el-button type="border" size="medium" @click="getList">刷新</el-button>
        </div>
        <el-table :data="tableData" v-loading="loading">
            <el-table-column label="命令标识符" prop="command_identifier" width="240"></el-table-column>
            <el-table-column label="命令名称" prop="command_name" width="auto"></el-table-column>
            <el-table-column label="命令内容" prop="command_data" width="auto"></el-table-column>
            <el-table-column label="命令下发时间" prop="send_time" width="auto"></el-table-column>

            <el-table-column label="状态" prop="send_status" width="100">
                <template v-slot="scope">
                    {{ scope.row.process_result == '1' ? $t('AUTOMATION.SUCEESSFUL') : $t('AUTOMATION.FAILURE') }}
                </template>
            </el-table-column>
            <el-table-column label="状态描述" prop="desc" width="auto"></el-table-column>

        </el-table>
        <!-- 表 end -->

        <div class="text-right py-3">
            <el-pagination background layout="prev, pager, next" :total="total" :current-page.sync="params.current_page"
                :page-size="params.per_page" @current-change="getList"></el-pagination>
        </div>

        <el-dialog  title="下发命令" :append-to-body="true" :visible.sync="commandDialogVisible" width="30%" :before-close="handleClose">
            <el-form class="el-dark-input"  label-position="left" :model="commandFormData" label-width="100px">
                <el-form-item label="命令标识符" prop="command_identifier">
                    <el-select v-model="commandFormData.command_identifier" @change="handleChangeCommandId">
                        <el-option v-for="(command, index) in commands" :key="index" :label="command.commandName" :value="command.commandId">
                            <span style="float: left">{{ command.commandName }}</span>
                            <span style="float: right; color: #8492a6; font-size: 13px">{{ command.commandId }}</span>
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="命令内容" prop="command_data">
                    <el-input type="textarea" readonly :rows="12" v-model="commandFormData.command_data"></el-input>
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
import { getDeviceCommandHistoryList, sendCommandByDeviceId, getDeviceCommandList } from '@/api/device'
import { message_success } from '@/utils/helpers.js'
export default {
    components: {},
    props: {
        device: {
            type: [Object],
            default: () => ({})
        }
    },
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
            commands: []
        }
    },
    mounted() {
        this.getList();
        this.getDeviceCommandList();
    },
    methods: {
        /**
         * 获取设备命令历史列表
         */
        getList() {
            getDeviceCommandHistoryList({ device_id: this.device.device, ...this.params })
                .then(({ data }) => {
                    if (data.code === 200) {
                        this.tableData = data.data.data
                        this.total = data.data.total
                    }
                })
        },
        /**
         * 获取设备命令列表
         */
        getDeviceCommandList() {
            getDeviceCommandList({ device_id: this.device.device })
                .then(({ data }) => {
                    if (data.code === 200) {
                        this.commands = data.data
                    }
                })
        },
        handleChangeCommandId(id) {
            this.commands.findIndex(command => {
                if (command.commandId === id) {
                    this.commandFormData.command_data = JSON.stringify(command.commandParams, null, 4);
                }
            })
            console.log('handleChangeCommandId', id, this.commands)
        },
        /**
         * 发送命令
         */
        handleSendCommand() {
            sendCommandByDeviceId({ device_id: this.device.device, ...this.commandFormData })
                .then(({ data }) => {
                    if (data.code === 200) {
                        message_success('命令下发成功');
                        this.commandDialogVisible = false;
                    }
                })
        },
        handleClose() {
            this.commandDialogVisible = false;
        }
    }
}
</script>
<style lang="scss" scoped></style>