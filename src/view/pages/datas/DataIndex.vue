<template>
<div class="rounded card p-4">
  <el-row type="flex" :gutter="20" class="pt-3 pb-3 px-3">
    <el-col>
      <TableTitle>{{ $t('DATA_MANAGEMENT.DATAS') }}</TableTitle>
    </el-col>
  </el-row>

  <!-- 头 start -->
  <el-row type="flex" :gutter="10" class="pt-3 pb-4 px-3 el-dark-input">
    <el-col :span="4">
      <BusinessSelector
          :business_id.sync="params.business_id"
          @change="handleBusinessSelectorChange()"></BusinessSelector>
    </el-col>

    <el-col :span="4">
      <DeviceGroupSelector
          :business_id="params.business_id"
          :asset_id.sync="params.asset_id"
          @change="handleSearch()"></DeviceGroupSelector>
    </el-col>

<!--    <el-col :span="4">-->
<!--      <el-input-->
<!--          v-model="params.token"-->
<!--          :placeholder="$t('COMMON.PLACEHOLDER36')"-->

<!--          clearable-->
<!--          @keydown.enter.native="handleSearch()"-->
<!--          @clear="handleSearch()">-->
<!--      </el-input>-->
<!--    </el-col>-->

    <el-col :span="4">
      <el-input
          v-model="params.device_name"
          :placeholder="$t('DATA_MANAGEMENT.PLACEHOLDER3')"
   
          clearable
          @keydown.enter.native="handleSearch()"
          @clear="handleSearch()">
      </el-input>
    </el-col>

    <el-col :span="4">
      <el-input
          v-model="params.key"
          :placeholder="$t('DATA_MANAGEMENT.PLACEHOLDER4')"
   
          clearable
          @keydown.enter.native="handleSearch()"
          @clear="handleSearch()">
      </el-input>
    </el-col>

    <el-col :span="7">
      <el-date-picker
          class="w-100"
          v-model="datetimerange"
          :picker-options="DatePickerOptions"
          :clearable="false"
          value-format="yyyy-MM-dd HH:mm:ss"
          @change="handleSearch()"
          type="datetimerange"
          :start-placeholder="$t('DATA_MANAGEMENT.PLACEHOLDER5')"
          :range-separator="$t('DATA_MANAGEMENT.PLACEHOLDER6')"
          :end-placeholder="$t('DATA_MANAGEMENT.PLACEHOLDER7')">
      </el-date-picker>
    </el-col>

    <el-col :span="5">
      <div>
        <el-button class="mr-2" type="border" size="medium" @click="handleSearch()">{{ $t('DATA_MANAGEMENT.SEARCH') }}</el-button>

        <el-popconfirm :confirm-button-text="$t('COMMON.CONFIRM')" :cancel-button-text="$t('COMMON.CANCEL')" :title="`确定导出 ${total} 条数据吗?`" @confirm="handleExport()">
          <el-button slot="reference" type="export" size="medium">{{ $t('DATA_MANAGEMENT.EXPORT') }}</el-button>
        </el-popconfirm>

<!--        <el-button class="ml-2" type="default" size="medium" @click="handleReset()">重置</el-button>-->
      </div>
    </el-col>
  </el-row>
  <!-- 头 end -->

  <!-- 表 start -->
  <el-table :data="tableData">
    <el-table-column :label="$t('DATA_MANAGEMENT.NO')" type="index" width="50">
      <template v-slot="scope">
        <span>{{ (params.page - 1) * 10 + scope.$index + 1 }}</span>
      </template>
    </el-table-column>
    <el-table-column :label="$t('DATA_MANAGEMENT.BUSINESSNAME1')" prop="bname"></el-table-column>

    <el-table-column :label="$t('DATA_MANAGEMENT.DWVICEGROUPNAME1')" prop="asset_name"></el-table-column>
    <el-table-column :label="$t('DATA_MANAGEMENT.GATEWAYNAME')"  prop="gateway_name"></el-table-column>
    <el-table-column :label="$t('DATA_MANAGEMENT.DEVICENAME1')" prop="device_name"></el-table-column>
<!--    <el-table-column label="Token" prop="token" width="300">-->
<!--      <template v-slot="scope">-->
<!--        <span class="cursor-pointer" @click="handleSearch({token: scope.row.token})">{{scope.row.token}}</span>-->
<!--      </template>-->
<!--    </el-table-column>-->

    <el-table-column :label="$t('DATA_MANAGEMENT.TIMES')"  prop="ts"></el-table-column>
    <el-table-column :label="$t('DATA_MANAGEMENT.PROPERTY_ASLIAS')" prop="alias"></el-table-column>
    <el-table-column :label="$t('DATA_MANAGEMENT.TITLE30')" prop="key"></el-table-column>
    <el-table-column :label="$t('DATA_MANAGEMENT.TITLE31')" prop="dbl_v" show-overflow-tooltip>
      <template v-slot="scope">
        <div v-if="scope.row.str_v.indexOf('file') == -1">
          {{ scope.row.str_v != "" ? scope.row.str_v : scope.row.dbl_v }}
        </div>
<!--        <el-avatar v-else :src="url + scope.row.str_v"></el-avatar>-->
        <el-image v-else
            style="width: 60px; height: 60px"
            :src="url + scope.row.str_v"
            :preview-src-list="imgView(scope.row.str_v)">
        </el-image>
      </template>
    </el-table-column>

    <el-table-column :label="$t('DATA_MANAGEMENT.TITLE32')" prop="entity_type"></el-table-column>
    
    <template #empty>
      <div>{{ $t('COMMON.TABLE_NO_DATA') }}</div>
    </template>
  </el-table>
  <!-- 表 end -->

  <div class="text-right py-3">
    <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :current-page.sync="params.page"
        :page-size="params.limit"
        @current-change="getKvIndex"></el-pagination>
  </div>

  <el-dialog
      class="el-dark-dialog el-dark-input"
      width="30%"
      :title="$t('DATA_MANAGEMENT.EXPORT')"
      :visible.sync="exportVisible">

    <div class="text-center">
      <p>{{ downloadUrl ? downloadUrl.split('/').pop().toString() : $t('DATA_MANAGEMENT.GENERATE_WAIT') }}</p>
      <p v-if="!exporting">
          <a :href="downloadUrl">{{ $t('DATA_MANAGEMENT.CLICKDOWNLOAD') }}</a>
      </p>
    </div>

  </el-dialog>
</div>
</template>

<script>
import {defineComponent, watch} from "@vue/composition-api";
import DatePickerOptions from "@/utils/DatePickerOptions";
import useDataIndex from "@/view/pages/datas/useDataIndex";
import {dateFormat} from "@/utils/tool";
import useDataCalender from "@/view/pages/datas/useDataCalender";
import useDataExport from "@/view/pages/datas/useDataExport";
import TableTitle from "@/components/common/TableTitle.vue"
import BusinessSelector from "@/components/common/BusinessSelector";
import DeviceGroupSelector from "@/components/common/DeviceGroupSelector.vue"

export default defineComponent({
  name: "DataIndex",
  components: {
    TableTitle,
    BusinessSelector,
    DeviceGroupSelector,
  },
  setup(){
    const url = (process.env.VUE_APP_BASE_URL ||
    document.location.protocol + "//" + document.domain + ":9999/")
    const {
      tableData,
      loading,
      params,
      total,
      getKvIndex,
      datetimerange,
      handleSearch,
      handleReset
    } = useDataIndex()

    // 清除 business 选择器
    function handleBusinessSelectorChange(){
      // 清除资产的筛选
      params.asset_id = ""
      handleSearch()
    }


    function imgView(str) {
      let arr = [];
      arr.push(this.url + str);
      return arr;
    }

    // 导出
   const {
     exportVisible,
     downloadUrl,
     exporting,
     handleExport,
   } = useDataExport(params)



    return {
      url,
      tableData,
      loading,
      params,
      total,
      getKvIndex,
      imgView,
      datetimerange,
      DatePickerOptions,
      handleSearch,
      handleReset,
      dateFormat,
      handleExport,
      exportVisible,
      downloadUrl,
      exporting,
      handleBusinessSelectorChange,
    }
  }
})
</script>

<style scoped>

</style>