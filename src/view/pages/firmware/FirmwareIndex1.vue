<template>
<div class="firmware rounded p-4 card no-border v-application el-table-transparent">
<!--  <div class="firmware-header pb-5">-->
<!--    <v-btn depressed color="primary" class="ml-2" @click="dialogVisible = true">新增固件</v-btn>-->
<!--    <v-btn depressed color="primary" class="ml-2">导入产品</v-btn>-->
<!--    <v-btn depressed color="indigo">Error</v-btn>-->
<!--    <el-button class="create-btn" type="primary" size="medium">新增固件</el-button>-->
<!--    <el-button type="primary" size="medium">导入产品</el-button>-->
<!--  </div>-->

  <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
    <el-col :span="12">
      <TableTitle>{{ $t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWAREUPGRADE') }}</TableTitle>
    </el-col>
    <el-col :span="12" class="text-right">
      <el-button type="indigo" size="medium" @click="dialogVisible = true">{{ $t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.ADDFIRMWARE') }}</el-button>

      <el-button type="indigo" size="medium">{{ $t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.IMPORTPRODUCT') }}</el-button>
    </el-col>
  </el-row>

  <el-table :data="tableData">
    <el-table-column :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.NO')" type="index" width="50"></el-table-column>
    <el-table-column prop="firmware_name" :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWARENAME')"></el-table-column>
    <el-table-column prop="product" :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.BELONGINGPRODUCT')"></el-table-column>
    <el-table-column prop="firmware_version" :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.FIRMWAREVERSION')"></el-table-column>
    <el-table-column prop="created_at" :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.CREATEDTIME')"></el-table-column>
    <el-table-column prop="actions" :label="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.OPERATION')" width="200px" align="center">
      <template v-slot="scope">
        <el-button class="mr-3" size="mini" type="indigo" @click="startEditor(scope.row)">{{ $t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.CONFIG') }}</el-button>

        <el-popconfirm :title="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.TITLE4')" @confirm="handle_del(scope.row)">
          <el-button slot="reference" size="mini" type="danger">{{ $t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.DELETE') }}</el-button>
        </el-popconfirm>
      </template>
    </el-table-column>
  </el-table>

  <el-dialog
      class="el-dark-dialog el-dark-input"
      :title="$t('PRODUCT_MANAGEMENT.FIRMWARE_LIST.ADDFIRMWARE')"
      :visible.sync="dialogVisible"
      :close-on-click-modal="false"
      width="30%">
    <CreateForm @submit="handle_create"></CreateForm>
  </el-dialog>
</div>
</template>

<script>
import TableTitle from "@/components/common/TableTitle.vue"
import data from "./data"
import CreateForm from "./CreateForm.vue"
export default {
  name: "FirmwareIndex",
  components: {
    CreateForm,
    TableTitle,
  },
  data:()=>({
    tableData:data,
    dialogVisible: false,
  }),
  created() {
  },
  methods: {
    handle_del(item){
      let index = this.tableData.indexOf(item)
      this.tableData.splice(index, 1)
    },
    startEditor(item){
      console.log(item)
    },
    handle_create(form){
      this.tableData.unshift(form)
      this.dialogVisible = false
    }
  }
}
</script>

<style lang="scss">

</style>