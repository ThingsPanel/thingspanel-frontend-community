<template>
  <div class="rounded card p-4 el-table-transparent el-dark-input">
    <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
      <el-col :span="12">
        <TableTitle>{{ params.product_name }} - {{ $t('PRODUCT_MANAGEMENT.BATCH_LIST.BATCHLIST') }}</TableTitle>
      </el-col>

      <el-col :span="12" class="px-2 text-right">
        <el-button size="medium" type="border" @click="handleCreate">{{ $t('PRODUCT_MANAGEMENT.BATCH_LIST.CREATEBATCH') }}</el-button>
        <el-button size="medium" type="border" @click="handleImport">导入数据</el-button>
      </el-col>
    </el-row>

    <!-- 表 start -->
    <el-form class="inline-edit">
      <el-table :data="tableData" v-loading="loading">

        <!-- 批号-->
        <el-table-column :label="$t('PRODUCT_MANAGEMENT.BATCH_LIST.BATCHNUMBER')" prop="batch_number" align="left">

        </el-table-column>

        <!-- 设备数量-->
        <el-table-column :label="$t('PRODUCT_MANAGEMENT.BATCH_LIST.DEVICENUMBER')" prop="device_number" align="center">

        </el-table-column>

   
        <!-- 创建日期-->
        <el-table-column :label="$t('PRODUCT_MANAGEMENT.BATCH_LIST.CREATEDATE')" prop="created" align="center">
          <template v-slot="scope">
            {{ scope.row.created ? scope.row.created : "--"}}
          </template>
        </el-table-column>

        <!-- 操作列-->
        <el-table-column align="right" :label="$t('PRODUCT_MANAGEMENT.BATCH_LIST.OPERATION')" width="320px">
          <template v-slot="scope">
            <div class="text-right">
              <el-button type="indigo"  class="mr-1" size="mini" 
                v-if="scope.row.generate_flag !== '1'" @click="generateData(scope.row)">{{ $t('PRODUCT_MANAGEMENT.BATCH_LIST.GENERATEDATA') }}</el-button>
              
              <el-button type="indigo"  class="mr-1" size="mini" 
                v-if="scope.row.generate_flag == '1'" @click="viewPreRegistration(scope.row)">查看预注册</el-button>

              <el-button type="indigo" class="mr-1" size="mini"
                v-if="scope.row.generate_flag == '1'"  :loading="exportLoading"
                @click="exportQRCodeAndData(scope.row)">{{ $t('PRODUCT_MANAGEMENT.BATCH_LIST.IMPORTDATA') }}</el-button>

              <!-- <el-button type="indigo" class="mr-1" size="mini" @click="exportData(scope.row)">{{ $t('PRODUCT_MANAGEMENT.BATCH_LIST.IMPORTDATA') }}</el-button> -->
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

    <!-- 导入数据 -->
    <import-batch :visible.sync="importDialogVisible" 
                  @submit="getBatchList"></import-batch>

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
import ImportBatch from "./ImportBatch.vue";
import {message_success} from "@/utils/helpers";
import {dateFormat} from "@/utils/tool";
export default {
  name: "BatchList",
  components: { TableTitle, CreateBatch, ImportBatch },
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
      exportLoading: false,
      importDialogVisible: false,
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
      this.loading = true;
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
          .finally(() => {
            this.loading = false;
          })
    },
    /**
     * @description: 查看预注册
     * @param {*} item
     * @return {*}
     */       
    viewPreRegistration(item) {
      console.log("viewPreRegistration", this.$route.query, item)
      const { product_id, product_name } = this.$route.query;
      this.$router.push({ path: "/product/batch/pre-registration", 
        query: { 
          batchId: item.id, 
          productName: product_name,
          batchNumber: item.batch_number,
        }})
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
            this.getBatchList();
            message_success("批次生成成功！")
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
      this.exportLoading = true;
      ProductAPI.exportQRCodeAndData(({ id: item.id }))
        .then(({ data }) => {
          if (data.code == 200) {
            this.downloadUrl = data.data;
            this.exportVisible = true;
          } else {
            this.exportVisible = false;
          }
        })
        .finally(() => {
          this.exportLoading = false;
        })

    },
    /**
     * 导出数据
     * @param item
     */
    exportData(item) {

    },
    /**
     * @description: 导入批次
     * @return {*}
     */    
    handleImport() {
      this.importDialogVisible = true;
    }
  }
}
</script>

<style scoped>

</style>