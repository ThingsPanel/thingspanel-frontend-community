<template>
  <div class="rounded card p-4">
    <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
      <el-col :span="12">
        <TableTitle>{{ $t('COMMON.PRODUCTLIST') }}</TableTitle>
      </el-col>

      <el-col :span="12" class="px-2 text-right">
        <el-button size="medium" type="indigo" @click="handleCreate">{{ $t('COMMON.CREATEPRODUCT') }}</el-button>
      </el-col>
    </el-row>

    <!-- 筛选 start -->
    <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3 el-dark-input">

      <el-col :span="12">
        <el-input :placeholder="$t('COMMON.PRODUCTNUMBER')" v-model="params.serialNumber" clearable></el-input>
      </el-col>

      <el-col :span="12" class="text-right">
        <el-button type="indigo" size="medium" @click="handleSearch">{{ $t('COMMON.SEARCH') }}</el-button>
        <!--      <el-button type="default" size="medium" @click="handleReset()">重置</el-button>-->
      </el-col>
    </el-row>
    <!-- 筛选 end -->

    <!-- 表 start -->
    <el-form class="inline-edit">
      <el-table :data="tableData" v-loading="loading">

        <!-- 产品编号-->
        <el-table-column :label="$t('COMMON.PRODUCTNUMBER')" prop="serial_number" align="center">

        </el-table-column>

        <!-- 产品名称-->
        <el-table-column :label="$t('COMMON.PRODUCTNAME')" prop="name" align="center">

        </el-table-column>

        <!--  协议类型-->
        <el-table-column :label="$t('COMMON.PROTOCOLTYPE1')" prop="protocol_type" align="center">
          <template v-slot="scope">
            <el-tag>{{ scope.row.protocol_type }}</el-tag>
          </template>
        </el-table-column>

        <!-- 认证方式-->
        <el-table-column :label="$t('COMMON.AUTHENTICATION')" prop="auth_type" align="center">
          <template v-slot="scope">
            <el-tag v-if="scope.row.auth_type == '1'">AccessToken</el-tag>
            <el-tag v-else-if="scope.row.auth_type == '2'">MQTTBasic</el-tag>
          </template>
        </el-table-column>

        <!-- 产品描述-->
        <el-table-column :label="$t('COMMON.PRODUCTDESCRIPTION')" prop="describe" align="center">
          <template v-slot="scope">
             {{ scope.row.describe ? scope.row.describe : "--"}}
          </template>
        </el-table-column>

        <!-- 创建日期-->
        <el-table-column :label="$t('COMMON.CREATEDATE')" prop="created" align="center">
          <template v-slot="scope">
            {{ scope.row.created ? scope.row.created : "--"}}
          </template>
        </el-table-column>

        <!-- 操作列-->
        <el-table-column align="center" :label="$t('COMMON.OPERATION')" width="360">
          <template v-slot="scope">
            <div class="text-center">
              <el-button type="indigo" size="mini" @click="showBatch(scope.row)">{{ $t('COMMON.VIEWBATCH') }}</el-button>
              <el-popconfirm title="确定要删除吗？" @confirm="handleDelete(scope.row)">
                <el-button slot="reference" size="mini" type="danger">{{ $t('COMMON.DELETE') }}</el-button>
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
          @current-change="getProductList"></el-pagination>
    </div>

    <create-product :visible.sync="createDialogVisible" :data="{}" @submit="handleSearch"></create-product>

  </div>
</template>

<script>
import TableTitle from "@/components/common/TableTitle.vue"
import ProductAPI from "@/api/product.js"
import CreateProduct from "./CreateProduct";
import {message_success} from "../../../../utils/helpers";
import {dateFormat} from "@/utils/tool";

export default {
  name: "index",
  components: {CreateProduct, TableTitle },
  data() {
    return {
      tableData: [],
      loading: false,
      createDialogVisible: false,
      params: {
        serialNumber: "",
        total: 0,
        current_page: 1,
        per_page: 10
      }
    }
  },
  mounted() {
    this.getProductList();
  },
  methods: {
    /**
     * 获取产品列表
     */
    getProductList() {
      this.params.serial_number = "%" + this.params.serialNumber + "%";
      ProductAPI.page(this.params)
        .then(({ data }) => {
          if (data.code == 200) {
            this.tableData = data.data.data.map(item => {
              item.created = dateFormat(item.created_time)
              return item;
            })
          }
        })
    },
    handleSearch() {
      this.getProductList();
    },
    /**
     * 打开创建产品对话框
     */
    handleCreate() {
      this.createDialogVisible = true;
    },
    /**
     * 显示批次
     * @param item
     */
    showBatch(item) {
      this.$router.push({ name: "BatchList", query: {product_id: item.id, product_name: item.name } })
    },
    handleDelete(item) {
      ProductAPI.del({id: item.id })
        .then(({data}) => {
          if (data.code == 200) {
            message_success("产品删除成功");
            this.getProductList();
          }
          console.log(data)
        })
    }
  }
}
</script>

<style scoped>

</style>