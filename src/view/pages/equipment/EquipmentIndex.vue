<template>
  <div class="rounded card p-4 el-table-transparent">
    <el-row type="flex" :gutter="20" class="pt-3 pb-3 px-3">
      <el-col>
        <TableTitle>设备日志</TableTitle>
      </el-col>
    </el-row>

    <!-- 头 start -->
    <el-row type="flex" :gutter="10" class="pt-3 pb-4 px-3 el-dark-input">
      <el-col :span="10">
        <el-input
          placeholder="请输入业务名称"
          size="medium"
          v-model="params.business_name"
          clearable
          @clear="handleSearch()"
        >
          <!--        <template slot="prepend">IP</template>-->
        </el-input>
      </el-col>
      <el-col :span="10">
        <el-input
          placeholder="请输入设备分组名称"
          size="medium"
          v-model="params.asset_name"
          clearable
          @clear="handleSearch()"
        >
          <!--        <template slot="prepend">路径</template>-->
        </el-input>
      </el-col>
      <el-col :span="10">
        <el-select v-model="params.operation_type" size="medium" placeholder="请选择操作类型">
          <el-option label="定时触发" value="1"></el-option>
          <el-option label="手动控制" value="2"></el-option>
        </el-select>
      </el-col>
      <el-col :span="10">
        <el-select v-model="params.send_result" placeholder="请选择发送结果" size="medium">
          <el-option label="成功" value="1"></el-option>
          <el-option label="失败" value="2"></el-option>
        </el-select>
      </el-col>
      <el-col :span="14" class="text-right">
        <el-button type="indigo" size="medium" @click="handleSearch()" class="butStyle"
          >查询</el-button
        >
        <el-button type="default" size="medium" @click="handleReset()" class="butStyle">重置</el-button>
      </el-col>
    </el-row>
    <!-- 头 end -->

    <!-- 表 start -->
    <el-table :data="tableData" v-loading="loading">
      <el-table-column :label='$t("COMMON.NUMBERID")' type="index" width="50"  align="center"></el-table-column>
      <el-table-column :label='$t("COMMON.BUSINESSNAME1")' prop="business_name">
        <template v-slot="scope">
          <span
            class="cursor-pointer"
            @click="handleSearch({ business_name: scope.row.business_name })"
            >{{ scope.row.business_name }}</span
          >
        </template>
      </el-table-column>
      <el-table-column :label='$t("COMMON.DEVICENAME1")' prop="device_name">
        <template v-slot="scope">
          {{ scope.row.device_name }}
        </template>
      </el-table-column>

      <el-table-column :label='$t("COMMON.DWVICEGROUPNAME1")' prop="asset_name"  width="150">
        <template v-slot="scope">
          <span
            class="cursor-pointer"
            @click="handleSearch({ asset_name: scope.row.asset_name })"
            >{{ scope.row.asset_name }}</span
          >
        </template>
      </el-table-column>

      <el-table-column :label='$t("COMMON.INSTRUCTION1")' prop="instruct">
        <template v-slot="scope">
          {{ scope.row.instruct }}
        </template>
      </el-table-column>
      <el-table-column :label='$t("COMMON.OPERATIONTYPE1")' prop="operation_type">
         <template v-slot="scope">
          {{ scope.row.instruct == 1 ?"定时触发":"手动控制" }}
        </template>
      </el-table-column>
      <el-table-column :label='$t("COMMON.TRIGGERINGTIME1")' prop="cteate_time" width="145"></el-table-column>
       <!-- <el-table-column :label='$t("COMMON.BUSINESS")' ></el-table-column> -->
       <!-- <div class="text-title">{{ $t("COMMON.BUSINESS") }}：</div> -->
      <el-table-column :label='$t("COMMON.SENDTHERESULIT1")'  prop="send_result" align="center"  width="130">
       
              <template v-slot="scope"  >
                <div class="divStyle">
                   <p class="green" v-if="scope.row.send_result == '1'"><span>{{"成功"}}</span></p>
                <p v-else  class="orange">{{"失败"}}</p>
                </div>
            </template>
      </el-table-column>
      <el-table-column :label='$t("COMMON.PROTOCOLTYPE1")' prop="protocol_type" align="center"></el-table-column>
    </el-table>
    <!-- 表 end -->

    <div class="text-right py-3">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :current-page.sync="params.page"
        :page-size="params.limit"
        @current-change="getOperationIndex"
      ></el-pagination>
    </div>
  </div>
</template>

<script>
import {
  defineComponent,
  ref,
  onMounted,
  reactive,
} from "@vue/composition-api";
import TableTitle from "@/components/common/TableTitle.vue";
import ApiService from "@/core/services/api.service";
import AUTH from "@/core/services/store/auth.module";
import {is_string} from "@/utils/helpers";
export default defineComponent({
  name: "EquipmentIndex",
  components: {
    TableTitle,
  },
  setup() {
    let tableData = ref([]);
    let loading = ref(false);
    let params = reactive({
      business_name: "",
      per_page: 10,
      current_page: 1,
      asset_name: "",
      operation_type: "",
      send_result: "",
    });
    let total = ref(0);

    onMounted(() => {
      queryValue();
    });

    // 数据查询 /api/conditions/log/index
    const queryValue = () => {
      ApiService.post(AUTH.local_url + "/conditions/log/index", params).then(
        ({ data }) => {
          if (data.code == 200) {
            tableData.value = data.data.data;
            total.value = data.data.total;
            loading.value = false
          }
        }
      );
    };
    const handleSearch = (filter) => {
      // 有传参的时候才赋值查询
      if (filter) {
        if ("business_name" in filter && is_string(filter.business_name)) {
          params.business_name = filter.business_name;
        }
        if ("asset_name" in filter && is_string(filter.asset_name)) {
          params.asset_name = filter.asset_name;
        }
        if ("operation_type" in filter && is_string(filter.operation_type)) {
          params.operation_type = filter.operation_type;
        }
        if ("send_result" in filter && is_string(filter.send_result)) {
          params.send_result = filter.send_result;
        }
      }

      params.current_page = 1;
      queryValue();
    };
    const getOperationIndex = (page) => {
        loading.value = true
        params.current_page = page;
        queryValue();
    };
    const handleReset=()=>{
      params.business_name= "";
      params.per_page = 10;
      params.current_page= 1;
      params.asset_name= "";
      params.operation_type= "";
      params.send_result= "";
    }

    return {
      handleReset,
      getOperationIndex,
      queryValue,
      handleSearch,
      tableData,
      loading,
      params,
      total,
    };
  },
});
</script>

<style lang="scss">
.butStyle{
  height: 30px;
  line-height: 10px;
}

.green{
  color: chartreuse;
    border: 1px solid;
    width: 45px;
    height: 24px;
    border-radius: 20px;
}
.orange{
  color:orange;
  border: 1px solid;
  width: 45px;
  height: 24px;
  border-radius: 20px;
}
.divStyle{
  text-align: -webkit-center;
}
</style>
