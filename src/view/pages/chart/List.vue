<template>
  <div class="rounded card p-4">
    <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
      <el-col :span="12">
        <TableTitle>{{ $t('COMMON.VISUALIZATION') }}</TableTitle>
      </el-col>

      <el-col :span="12" class="px-2 text-right">
        <el-button size="medium" type="indigo"
                   @click="handleCreate()">创建可视化</el-button>
      </el-col>
    </el-row>
    <!-- 表 start -->
    <el-form class="inline-edit">
      <el-table :data="tableData" v-loading="loading">
        <el-table-column :label="$t('COMMON.NO')" type="index" align="center" width="80"></el-table-column>

        <el-table-column label="可视化名称" prop="name" align="center">
          <template v-slot="scope">
            <!-- 新建 -->
            <el-form-item v-if="scope.row.status" :error="scope.row.errors.name">
              <el-input size="medium" v-model="scope.row.formData.name" v-focus
                        @keydown.enter.native.prevent="handleSave(scope.row)"></el-input>
            </el-form-item>

            <div v-else class="text-center w-100 cursor-pointer" @click="showDeviceChart(scope.row)">
              <p>{{ scope.row.name }}</p>
            </div>
          </template>
        </el-table-column>

        <el-table-column align="center" :label="$t('COMMON.OPERATION')" width="360">
          <template v-slot="scope">
            <div class="text-center">
              <div v-if="scope.row.status">
                <el-button type="indigo" size="mini" @click="handleSave(scope.row)">保存</el-button>
                <el-button type="default" size="mini" @click="handleCancel(scope.row)">取消</el-button>
              </div>
              <div v-else>
                <el-button type="indigo" size="mini" @click="showVisual(scope.row)">查看</el-button>
                <el-button type="indigo" size="mini" @click="editVisual(scope.row)">编辑</el-button>
                <el-button type="indigo" size="mini" @click="delVisual(scope.row)">删除</el-button>
              </div>
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
          :total="total"
          :current-page.sync="params.page"
          :page-size="params.limit"
          @current-change="getBusinessIndex"></el-pagination>
    </div>

  </div>
</template>
<style scoped>

</style>

<script>
import { business_index } from "@/api/business";
import TableTitle from "@/components/common/TableTitle.vue"
import {message_error} from "../../../utils/helpers";

export default {
  name: "VisualizationList",
  components: {
    TableTitle
  },
  data: () => ({
    params: {page: 1, limit: 10},
    loading: false,
    total: 0,
    tableData: []
  }),
  created() {
    this.getBusinessIndex();
  },
  methods: {
    handleCreate() {
      if (this.tableData[0].status) return;
      this.tableData.unshift({
        name: "",
        status: "creating",
        errors: {
          name: ""
        },
        formData: {
          name: ""
        }
      })
    },
    handleSave(item) {
      // 验证
      if(!item.formData.name){
        item.errors.name = "请填写名称"
        message_error("大屏名称不能为空!")
        return true
      }

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
    getBusinessIndex() {
      if(this.loading) return;
      this.loading = true
      business_index(this.params).then(({data})=>{
        if(data.code === 200) {
          this.tableData = data.data.data ? data.data.data : []
          this.total = data.data.total
          console.log(data.data.data)
        }
      }).finally(()=>{
        this.loading = false
      })
    },
    showVisual(item) {

    },
    editVisual(item) {
      let query = {};
      const{ href } = this.$router.resolve({ name:"VisualEditor", query });
      window.open(href,'_blank');
    },
    delVisual(item) {

    },
    showDeviceChart(row) {
      console.log(row)
      // this.$router.push({name: "DeviceChart", query: {businessId: row.id, name: row.name}})
    },
  },
};
</script>
