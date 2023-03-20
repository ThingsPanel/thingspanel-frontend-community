<template>
  <div class="rounded card p-4">
    <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
      <el-col :span="12">
        <TableTitle>{{ $t('PLUGIN.TAB2_CONTENT.TITLE') }}</TableTitle>
      </el-col>

      <el-col :span="12" class="px-2 text-right">
        <el-button size="medium" type="indigo" @click="handleShowRegister">{{ $t('PLUGIN.TAB2_CONTENT.BTN') }}</el-button>
        <el-button size="medium" type="indigo" >发布</el-button>
      </el-col>
    </el-row>

    <!-- 表 start -->
    <el-form class="inline-edit">
      <el-table :data="params.data" v-loading="loading">

        <!-- 名称 -->
        <el-table-column :label="$t('PLUGIN.TAB2_CONTENT.NAME')" prop="name" align="left"></el-table-column>

        <!-- 设备类型 -->
        <el-table-column :label="$t('PLUGIN.TAB2_CONTENT.DEVICETYPE')" prop="device_type" align="left">
          <template v-slot="scope">
            <el-tag v-if="scope.row.device_type=='1'" type="success">{{ $t('PLUGIN.TAB2_CONTENT.DEVICE') }}</el-tag>
            <el-tag v-else-if="scope.row.device_type=='2'">{{ $t('PLUGIN.TAB2_CONTENT.NEWWORK') }}</el-tag>
          </template>
        </el-table-column>

        <!-- 协议类型 -->
        <el-table-column :label="$t('PLUGIN.TAB2_CONTENT.PROTOCOLTYPE')" prop="protocol_type" align="left"></el-table-column>

        <!-- 接入地址 -->
        <el-table-column :label="$t('PLUGIN.TAB2_CONTENT.CONNECTADDRESS')" prop="access_address" align="left"></el-table-column>

        <!-- HTTP服务器地址 -->
        <el-table-column :label="$t('PLUGIN.TAB2_CONTENT.HTTPADDRESS')" prop="http_address" align="left"></el-table-column>

        <!--  插件订阅主题前缀-->
        <el-table-column :label="$t('PLUGIN.TAB2_CONTENT.LABLE')" prop="sub_topic_prefix" align="left"></el-table-column>

        <!-- 作者-->
        <el-table-column :label="$t('PLUGIN.TAB2_CONTENT.AUTHOR')" prop="author" align="left"></el-table-column>

        <!-- 描述-->
        <el-table-column :label="$t('PLUGIN.TAB2_CONTENT.DESCRIBE')" prop="description" align="left">
          <template v-slot="scope">
            {{ scope.row.description ? scope.row.description : "--"}}
          </template>
        </el-table-column>

        <!-- 操作列-->
        <el-table-column align="left" :label="$t('PLUGIN.TAB2_CONTENT.OPERATION')" width="120">
          <template v-slot="scope">
            <div style="text-align: left">
              <el-popconfirm :title="$t('PLUGIN.TAB2_CONTENT.TITLE4')" @confirm="handleDelete(scope.row)">
                <el-button slot="reference" size="mini" type="danger" :disabled="!hasAuth('plugin:protocol:del')">{{ $t('PLUGIN.TAB2_CONTENT.DELETE') }}</el-button>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-form>
    <!-- 表 end -->

    <div class="text-right py-3">
      <el-pagination
          background
          layout="prev, pager, next"
          :total="params.total"
          :current-page.sync="params.current_page"
          :page-size="params.per_page"
          @current-change="getPluginList"></el-pagination>
    </div>

    <register-plugin :visible.sync="registerDialogVisible" :data="{}" @submit="handleRegistered"></register-plugin>
  </div>
</template>

<script>
import ProtocolPlugin from "@/api/protocolPlugin.js";
import TableTitle from "@/components/common/TableTitle.vue";
import RegisterPlugin from "./RegisterPlugin";
import {message_success} from "@/utils/helpers";
export default {
  name: "index",
  components: { TableTitle, RegisterPlugin },
  data() {
    return {
      loading: false,
      params: {
        total: 0,
        current_page: 1,
        per_page: 10,
        data: []
      },
      registerDialogVisible: false
    }
  },
  mounted() {
    this.getPluginList();
  },
  methods: {
    /**
     * 打开注册对话框
     */
    handleShowRegister() {
      this.registerDialogVisible = true;
    },
    /**
     * 注册后刷新列表
     */
    handleRegistered() {
      this.getPluginList();
    },
    /**
     * 获取插件列表
     */
    getPluginList() {
      this.loading = true;
      let params = { current_page: this.params.current_page, per_page: this.params.per_page }
      ProtocolPlugin.page(params)
        .then(({ data }) => {
          if (data.code == 200) {
            this.loading = false;
            this.params = data.data;
          }
        })
    },
    /**
     * 删除
     * @param row
     */
    handleDelete(row) {
      ProtocolPlugin.del({ id: row.id })
        .then(({ data }) => {
          if (data.code == 200 && data.message == "success") {
            message_success("删除成功！")
            this.getPluginList();
          }
        })
    }
  }
}
</script>

<style scoped>

</style>