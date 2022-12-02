<!-- 设备监控 -->
<template>
  <div class="rounded card p-4">
    <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
      <el-col :span="12">
        <TableTitle>设备监控</TableTitle>
      </el-col>
    </el-row>

    <!-- 表 start -->
    <el-form class="inline-edit">
      <el-table :data="tableData" v-loading="loading">
        <el-table-column :label="$t('COMMON.NO')" type="index" align="center" width="80"></el-table-column>

        <el-table-column label="项目名称" prop="name" align="center">
          <template v-slot="scope">
            <div class="text-center w-100 cursor-pointer" @click="showDeviceChart(scope.row)">
              <p>{{ scope.row.name }}</p>
            </div>
          </template>
        </el-table-column>

        <el-table-column align="center" :label="$t('COMMON.OPERATION')" width="360">
          <template v-slot="scope">
            <div class="text-center">
              <el-button type="indigo" size="mini" @click="showDeviceChart(scope.row)">查看</el-button>
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

export default {
  name: "DeviceWatch",
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
    showDeviceChart(row) {
      console.log(row)
      this.$router.push({name: "DeviceDetail", query: {businessId: row.id, name: row.name}})
    },
  },
};
</script>
