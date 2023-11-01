<!-- 设备监控 -->
<template>
  <div class="rounded card p-4">
    <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
      <el-col :span="12">
        <TableTitle>{{ $t('DEVICE_MONITORING.DEVICEMONITORING') }}</TableTitle>
      </el-col>
    </el-row>

    <!-- 表 start -->
    <el-form class="inline-edit">
      <el-table :data="tableData" v-loading="loading">
        <el-table-column :label="$t('DEVICE_MONITORING.NO')" type="index" width="110">
          <template v-slot="scope">
            <span>{{ (params.page - 1) * 10 + scope.$index + 1 }}</span>
          </template>
        </el-table-column>

        <el-table-column :label="$t('DEVICE_MONITORING.PROJECT_NAME')" prop="name" align="left">
          <template v-slot="scope">
            <div class="w-100 cursor-pointer" @click="showDeviceChart(scope.row)">
              <p class="mad">{{ scope.row.name }}</p>
            </div>
          </template>
        </el-table-column>

        <el-table-column align="left" :label="$t('DEVICE_MONITORING.OPERATION')" width="90">
          <template v-slot="scope">
            <!-- <div class="text-center">
              <el-button type="indigo" size="mini" @click="showDeviceChart(scope.row)">查看</el-button>
            </div> -->
            <div style="text-align: left">
              <el-button type="indigo" size="mini" @click="showDeviceChart(scope.row)">{{ $t("DEVICE_MONITORING.VIEW")}}</el-button>
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
.mad{
  margin-bottom: 0;
}


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
        }
      }).finally(()=>{
        this.loading = false
      })
    },
    showDeviceChart(row) {
      this.$router.push({name: "DeviceDetail", query: {businessId: row.id, name: row.name}})
    },
  },
};
</script>
