<template>
  <div class="rounded card p-4">
    <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
      <el-col :span="12">
        <TableTitle>接入协议插件</TableTitle>
      </el-col>

      <el-col :span="12" class="px-2 text-right">
        <el-button size="medium" type="indigo" @click="handleShowRegister">注册插件</el-button>
      </el-col>
    </el-row>

    <!-- 表 start -->
    <el-form class="inline-edit">
      <el-table :data="params.data" v-loading="loading">

        <!-- 名称 -->
        <el-table-column label="名称" prop="name" align="left"></el-table-column>

        <!-- 设备类型 -->
        <el-table-column label="设备类型" prop="device_type" align="left">
          <template v-slot="scope">
            <el-tag v-if="scope.row.device_type=='1'" type="success">设备</el-tag>
            <el-tag v-else-if="scope.row.device_type=='2'">网关</el-tag>
          </template>
        </el-table-column>

        <!-- 协议类型 -->
        <el-table-column label="协议类型" prop="protocol_type" align="left"></el-table-column>

        <!-- 接入地址 -->
        <el-table-column label="接入地址" prop="access_address" align="left"></el-table-column>

        <!-- HTTP服务器地址 -->
        <el-table-column label="HTTP服务器地址" prop="http_address" align="left"></el-table-column>

        <!--  插件订阅主题前缀-->
        <el-table-column label="插件订阅主题前缀" prop="sub_topic_prefix" align="left"></el-table-column>

        <!-- 作者-->
        <el-table-column label="作者" prop="author" align="left"></el-table-column>

        <!-- 描述-->
        <el-table-column label="描述" prop="description" align="left">
          <template v-slot="scope">
            {{ scope.row.description ? scope.row.description : "--"}}
          </template>
        </el-table-column>

        <!-- 操作列-->
        <el-table-column align="left" :label="$t('COMMON.OPERATION')" width="120">
          <template v-slot="scope">
            <div style="text-align: left">
              <el-popconfirm title="确定要删除吗？" @confirm="handleDelete(scope.row)">
                <el-button slot="reference" size="mini" type="danger" :disabled="!hasAuth('plugin:protocol:del')">{{ $t('COMMON.DELETE') }}</el-button>
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