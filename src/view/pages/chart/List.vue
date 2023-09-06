<template>
  <div class="rounded card p-4">
    <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
      <el-col :span="12">
        <TableTitle>{{ $t('VISUALIZATION.TITLE') }}</TableTitle>
      </el-col>

      <el-col :span="12" class="px-2 text-right">
        <el-button size="medium" type="border" @click="handleCreate()">{{ $t('VISUALIZATION.NEWVISUALIZATION')
        }}</el-button>
      </el-col>
    </el-row>
    <!-- 表 start -->
    <el-form class="inline-edit">
      <el-table :data="tableData" v-loading="loading">
        <el-table-column :label="$t('VISUALIZATION.NO')" type="index" align="left" min-width="110" width="200">
          <template v-slot="scope">
            <span>{{ (params.current_page - 1) * 10 + scope.$index + 1 }}</span>
          </template>
        </el-table-column>

        <el-table-column :label="$t('VISUALIZATION.VISUALIZATIONNAME')" prop="dashboard_name" align="left">
          <template v-slot="scope">
            <!-- 新建 -->
            <el-form-item v-if="scope.row.status" :error="scope.row.errors.dashboard_name">
              <el-input size="medium" v-model="scope.row.formData.dashboard_name" v-focus
                @keydown.enter.native.prevent="handleSave(scope.row)"></el-input>


            </el-form-item>

            <div v-else class="w-100 cursor-pointer" @click="showDeviceChart(scope.row)">
              <p class="mad">{{ scope.row.dashboard_name }}</p>
            </div>
          </template>
        </el-table-column>

        <el-table-column align="left" :label="$t('VISUALIZATION.OPERATION')" width="230">
          <template v-slot="scope">
            <div style="text-align: left">
              <div v-if="scope.row.status">
                <el-button type="save" size="mini" @click="handleSave(scope.row)">{{ $t('VISUALIZATION.SAVE')
                }}</el-button>
                <el-button type="cancel" size="mini" @click="handleCancel(scope.row)">{{ $t('VISUALIZATION.CANCEL')
                }}</el-button>
              </div>
              <div v-else>
                <el-button type="yellow" size="mini" @click="showVisual(scope.row)">{{ $t('VISUALIZATION.VIEW')
                }}</el-button>
                <el-button type="indigo" size="mini" @click="editVisual(scope.row)">{{ $t('VISUALIZATION.EDIT')
                }}</el-button>
                <el-popconfirm :confirm-button-text="$t('COMMON.CONFIRM')" :cancel-button-text="$t('COMMON.CANCEL')" :disabled="!hasAuth('visual:del')" style="margin-left: 10px"
                  :title="$t('VISUALIZATION.TEXT44')" @confirm="delVisual(scope.row)">
                  <el-button slot="reference" type="danger" size="mini">{{ $t('VISUALIZATION.DELETE') }}</el-button>
                </el-popconfirm>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <template #empty>
          <div>{{ $t('COMMON.TABLE_NO_DATA') }}</div>
        </template>
      </el-table>
    </el-form>
    <!-- 表 end -->

    <div class="text-right py-3">
      <el-pagination background layout="prev, pager, next" :total="total" :current-page.sync="params.current_page"
        :page-size="params.per_page" @current-change="getVisualList"></el-pagination>
    </div>

  </div>
</template>
<style scoped>
.mad {
  margin-bottom: 0;
}
</style>

<script>
import TableTitle from "@/components/common/TableTitle.vue"
import { message_error, message_success } from "@/utils/helpers";
import VisualAPI from "@/api/visualization.js"
import JwtService from "@/core/services/jwt.service";
import { local_url } from "@/api/LocalUrl.js";
const url = (process.env.VUE_APP_BASE_URL || document.location.protocol + "//" + document.domain + ":9999/")

export default {
  name: "VisualizationList",
  components: {
    TableTitle
  },
  data: () => ({
    params: {
      current_page: 1,
      per_page: 10
    },
    loading: false,
    total: 0,
    tableData: [],
    localUrl: local_url
  }),
  created() {
    this.getVisualList();
  },
  methods: {
    handleCreate() {
      console.log("====handleCreate", this.tableData)
      if (this.tableData[0] && this.tableData[0].status) return;
      this.tableData.unshift({
        dashboard_name: "",
        status: "creating",
        errors: {
          dashboard_name: ""
        },
        formData: {
          dashboard_name: ""
        }
      })
    },
    handleSave(item) {
      // 验证
      if (!item.formData.dashboard_name || !item.formData.dashboard_name.trim()) {
        item.errors.dashboard_name = "请填写名称"
        message_error("可视化名称不能为空!")
        return true
      }
      VisualAPI.add(item.formData)
        .then(({ data }) => {
          if (data.code == 200) {
            this.getVisualList();
          } else {
            this.tableData.splice(0, 1);
          }
        })

      item.status = null;
    },
    handleCancel(item) {
      if (item.status === "creating") {
        // 取消创建的时候删除本条数据
        let index = this.tableData.indexOf(item)
        this.tableData.splice(index, 1)
      }
      item.status = null
    },
    /**
     * 获取可视化列表
     */
    getVisualList() {
      this.tableData = [];
      // ==================================================
      if (this.loading) return;
      this.loading = true
      VisualAPI.list(this.params)
        .then(({ data }) => {
          if (data.code == 200) {
            this.tableData = data.data.data;
            this.total = data.data.total;
            this.loading = false;
          }
        })
        .finally(() => {
          this.loading = false
        })
    },
    /**
     * 查看可视化
     * @param item
     */
    showVisual(item) {
      const id = item.id;
      const token = JwtService.getToken();
      const expiresTime = JwtService.getExpiresTime();
      let visualUrl = process.env.NODE_ENV === "production" ? "/visual" : "http://localhost:5173"
      const url = `${visualUrl}/display?id=${id}&token=${token}&expiresTime=${expiresTime}`
      window.open(url, '_blank');
    },
    /**
     * 编辑可视化
     * @param item
     */
    editVisual(item) {
      const id = item.id;
      const token = JwtService.getToken();
      const expiresTime = JwtService.getExpiresTime();
      sessionStorage.setItem("thingspanel_token", token);
      let visualUrl = process.env.NODE_ENV === "production" ? "/visual" : "http://localhost:5173"
      const url = `${visualUrl}/editor?id=${id}&token=${token}&expiresTime=${expiresTime}`
      window.open(url, '_blank');
    },
    /**
     * 删除可视化
     * @param item
     */
    delVisual(item) {
      VisualAPI.del({ id: item.id })
        .then(({ data }) => {
          if (data.code == 200) {
            message_success("删除成功!");
            this.getVisualList();
          }
        })
    },
    showDeviceChart(row) {
      console.log(row)
      
      // this.$router.push({name: "DeviceChart", query: {businessId: row.id, name: row.name}})
    },
  },
};
</script>
