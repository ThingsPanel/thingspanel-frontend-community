<template>
  <div class="rounded card p-4 el-table-transparent el-dark-input">
    <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
      <el-col :span="12">
        <TableTitle>{{ $t('PRODUCT_MANAGEMENT.BATCH_LIST.BATCHLIST') }}</TableTitle>
      </el-col>

      <el-col :span="12" class="px-2 text-right">
        <el-button size="medium" type="border" @click="handleCreate">{{ $t('PRODUCT_MANAGEMENT.BATCH_LIST.CREATEBATCH') }}</el-button>
      </el-col>
    </el-row>

    <!-- 表 start -->
    <el-form class="inline-edit">
      <el-table :data="tableData" v-loading="loading">

        <!-- 批号-->
        <el-table-column :label="$t('PRODUCT_MANAGEMENT.BATCH_LIST.BATCHNUMBER')" prop="batch_number" align="center">

        </el-table-column>

        <!-- 设备数量-->
        <el-table-column :label="$t('PRODUCT_MANAGEMENT.BATCH_LIST.DEVICENUMBER')" prop="device_number" align="center">

        </el-table-column>

        <!--  接入地址-->
        <el-table-column :label="$t('PRODUCT_MANAGEMENT.BATCH_LIST.CONNECTADDRESS')" prop="access_address"align="center">
        </el-table-column>

        <!-- 生成数据标志-->
        <el-table-column :label="$t('PRODUCT_MANAGEMENT.BATCH_LIST.GENERATEDATAFLAGS')" prop="generate_flag" align="center">
          <template v-slot="scope">
            <el-tag v-if="scope.row.generate_flag == '1'"  type="success">已生成</el-tag>
            <el-tag v-else type="danger">未生成</el-tag>
          </template>
        </el-table-column>

        <!-- 批次描述-->
        <el-table-column :label="$t('PRODUCT_MANAGEMENT.BATCH_LIST.BATCHDESCRIPTION')" prop="describe" align="center">
        </el-table-column>

        <!-- 创建日期-->
        <el-table-column :label="$t('PRODUCT_MANAGEMENT.BATCH_LIST.CREATEDATE')" prop="created" align="center">
          <template v-slot="scope">
            {{ scope.row.created ? scope.row.created : "--"}}
          </template>
        </el-table-column>

        <!-- 操作列-->
        <el-table-column align="left" :label="$t('PRODUCT_MANAGEMENT.BATCH_LIST.OPERATION')" width="540px">
          <template v-slot="scope">
            <div class="text-center">
              <el-button type="indigo" class="mr-1" size="mini" @click="viewPreRegistration(scope.row)">查看预注册</el-button>
              <el-button type="indigo" :disabled="scope.row.generate_flag == '1'" class="mr-1" size="mini" @click="generateData(scope.row)">{{ $t('PRODUCT_MANAGEMENT.BATCH_LIST.GENERATEDATA') }}</el-button>

             

              <el-button type="indigo" class="mr-1" size="mini" @click="exportQRCodeAndData(scope.row)">{{ $t('PRODUCT_MANAGEMENT.BATCH_LIST.EXPORTQRCODEANDDATA') }}</el-button>

              <el-button type="indigo" class="mr-1" size="mini" @click="importData(scope.row)">{{ $t('PRODUCT_MANAGEMENT.BATCH_LIST.IMPORTDATA') }}</el-button>
              <el-popconfirm class="mr-1" :title="$t('AUTOMATION.TITLE4')" @confirm="handleDelete(scope.row)">
                <el-button slot="reference" style="margin-left:10px" size="mini" type="danger">{{ $t('PRODUCT_MANAGEMENT.BATCH_LIST.DELETE') }}</el-button>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-form>
    <!-- 表 end -->

    <!-- 分页 start -->
    <div class="text-right py-3">
      <el-pagination
          background
          layout="prev, pager, next"
          :total="params.total"
          :current-page.sync="params.current_page"
          :page-size="params.per_page"
          @current-change="getBatchList"></el-pagination>
    </div>
    <!-- 分页 end -->

    <!-- 创建批次对话框 start -->
    <create-batch :visible.sync="createDialogVisible"
                  :data="params" @submit="getBatchList"></create-batch>
    <!-- 创建批次对话框 end -->

    <!-- 导出二维码和数据对话框 start -->
    <el-dialog
        class="el-dark-dialog el-dark-input"
        width="30%"
        :title="$t('PRODUCT_MANAGEMENT.BATCH_LIST.EXPORT')"
        :visible.sync="exportVisible">

      <div class="text-center">
        <p>{{ downloadUrl ? downloadUrl.split('/').pop().toString() : $t('PRODUCT_MANAGEMENT.BATCH_LIST.GENERATE_WAIT') }}</p>
        <p><a :href="downloadUrl">{{ $t('PRODUCT_MANAGEMENT.BATCH_LIST.CLICKDOWNLOAD') }}</a></p>
      </div>
    </el-dialog>
    <!-- 导出二维码和数据对话框 end -->

  </div>
</template>

<script>
import TableTitle from "@/components/common/TableTitle.vue"
import ProductAPI from "@/api/product.js"
import CreateBatch from "./CreateBatch";
import {message_success} from "@/utils/helpers";
import {dateFormat} from "@/utils/tool";
export default {
  name: "BatchList",
  components: { TableTitle, CreateBatch },
  data() {
    return {
      tableData: [],
      loading: false,
      params: {
        total: 0,
        current_page: 1,
        per_page: 10
      },
      createDialogVisible: false,
      generateEnabled: true,   // 生成数据按钮是否可用
      exportVisible: false, // 导出二维码和数据对话框
      exporting: false,
      downloadUrl: ""
    }
  },
  mounted() {
    if (this.$route.query.product_id) {
      this.params.product_id = this.$route.query.product_id;
      this.params.product_name = this.$route.query.product_name;
    }
    console.log(this.params)
    this.getBatchList();
  },
  methods: {
    /**
     * 获取产品列表
     */
    getBatchList() {
      ProductAPI.batchPage(this.params)
          .then(({ data }) => {
            if (data.code == 200) {
              // this.tableData = data.data.data;
              this.tableData = data.data.data.map(item => {
                item.created = dateFormat(item.created_time)
                return item;
              })
              console.log("tableData", this.tableData)
            }
          })
    },
    /**
     * @description: 查看预注册
     * @param {*} item
     * @return {*}
     */       
    viewPreRegistration(item) {
      this.$router.push({ path: "/product/batch/pre-registration"})
    },
    /**
     * 打开创建批次对话框
     */
    handleCreate() {
      this.createDialogVisible = true;
    },
    handleDelete(item) {
      ProductAPI.batchDel({id: item.id})
        .then(({ data }) => {
          if (data.code == 200) {
            this.getBatchList();
          }
        })
    },
    /**
     * 生成数据
     * @param item
     */
    generateData(item) {
      if (!this.generateEnabled) return;
      this.generateEnabled = false;
      ProductAPI.generateBatch({id: item.id})
        .then(({ data }) => {
          if (data.code == 200) {
            message_success("批次生成成功！")
            this.getBatchList();
          }
        })
        .finally(() => {
          this.generateEnabled = true;
        })
    },
    /**
     * 导出二维码和数据
     * @param item
     */
    exportQRCodeAndData(item) {
      ProductAPI.exportQRCodeAndData(({ id: item.id }))
        .then(({ data }) => {
          if (data.code == 200) {
            this.downloadUrl = data.data;
            this.exportVisible = true;
          } else {
            this.exportVisible = false;
          }
        })

    },
    /**
     * 导入数据
     * @param item
     */
    importData(item) {

    }
  }
}
</script>

<style scoped>

</style>