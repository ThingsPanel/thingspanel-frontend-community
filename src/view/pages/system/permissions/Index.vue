<template>
  <div class="rounded card p-4 el-table-transparent">
    <!-- 头 start -->
    <el-row type="flex" class="pt-3 pb-4 px-3">
      <el-col :span="12">
        <TableTitle>{{ $t('COMMON.PERMISSIONMANAGEMENT') }}</TableTitle>
      </el-col>
      <el-col :span="12" class="text-right">
        <!-- 添加权限按钮 -->
        <el-button size="medium" type="indigo" @click="handleAdd" :disabled="!hasAuth('sys:permission:add')">{{ $t('COMMON.PERMISSIONADD') }}</el-button>
      </el-col>
    </el-row>
    <!-- 头 end -->

    <!-- 表 start -->
    <el-table :data="tableData" v-loading="loading" row-key="id">
      <el-table-column type="index"></el-table-column>
      <el-table-column :label="$t('COMMON.TITLE')" prop="title" width="150px">
        <template v-slot="scope">
          {{ $t(scope.row.title) }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('COMMON.NAMES')" prop="name"></el-table-column>
      <el-table-column :label="$t('COMMON.ICON')" prop="icon"></el-table-column>
      <el-table-column label="url" prop="path"></el-table-column>
      <el-table-column :label="$t('COMMON.COMPONENT')" prop="component"></el-table-column>
      <el-table-column :label="$t('COMMON.THESORTING')" prop="sort"></el-table-column>
      <el-table-column :label="$t('COMMON.TYPE')" prop="type" align="left">
        <template v-slot="scope">
          <el-tag type="warning" v-show="scope.row.type == 0">{{ $t('COMMON.DIRECTORY') }}</el-tag>
          <el-tag type="success" v-show="scope.row.type == 1">{{ $t('COMMON.MENU') }}</el-tag>
          <el-tag type="danger" v-show="scope.row.type == 2">{{ $t('COMMON.ROUTING') }}</el-tag>
          <el-tag type="info" v-show="scope.row.type == 3">{{ $t('COMMON.BUTTON') }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column :label="$t('COMMON.OPERATION')" align="center" width="250">
        <template v-slot="scope">
          <div class="text-right">
            <el-button type="indigo" size="mini" @click="handleEdit(scope.row)" :disabled="!hasAuth('sys:permission:edit')">{{ $t('COMMON.EDIT') }}</el-button>
            <el-popconfirm :title="$t('COMMON.DELETETHISITEM')" @confirm="handleDelete(scope.row)">
              <el-button slot="reference" type="danger" size="mini"  :disabled="!hasAuth('sys:permission:del')">{{ $t('COMMON.DELETE') }}</el-button>
            </el-popconfirm>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <!-- 表 end -->

    <!-- 分页 start -->
    <div class="text-right py-3">
      <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :current-page.sync="params.current_page"
          :page-size="params.per_page"
          @current-change="getList"
          ></el-pagination>
    </div>
    <!-- 分页 end -->

    <el-dialog class="el-dark-dialog el-dark-input"
               :visible.sync="dialogVisible"
               @closed="dialogVisible = false"
               :close-on-click-modal="false"
               width="600px">
      <el-form :model="formData"
               label-position="right"
               label-width="100px"
               :inline="false"
      >
        <el-form-item label="父菜单：" style="width: 100%">
          <el-select v-model="formData.parent_id" placeholder="请选择"  style="width: 100%">
            <el-option value="0" label="root"></el-option>

            <template v-for="item in permissionOptions">
              <el-option :label="item['name']" :value="item.id" :key="item.id">
                <span>{{ '&emsp;&emsp;-- ' + item['name'] }}</span>
              </el-option>
              <template v-for="child in item.children">
                <el-option :label="child['name']" :value="child.id">
                  <span>{{ '&emsp;&emsp;&emsp;&emsp;&emsp;-- ' + child['name'] }}</span>
                </el-option>
              </template>
            </template>

          </el-select>
        </el-form-item>

        <el-form-item label="名称：" style="width: 100%">
          <el-input size="medium" v-model="formData.name"></el-input>
        </el-form-item>

        <el-form-item label="path：" style="width: 100%">
          <el-input size="medium" v-model="formData.path"></el-input>
        </el-form-item>

        <el-form-item label="组件路径：" style="width: 100%">
          <el-input size="medium" v-model="formData.component"></el-input>
        </el-form-item>

        <el-form-item label="标题：" style="width: 100%">
          <el-input size="medium" v-model="formData.title"></el-input>
        </el-form-item>

        <el-form-item label="图标：" style="width: 100%">
          <el-input size="medium" v-model="formData.icon"></el-input>
        </el-form-item>

        <el-form-item label="排序：" style="width: 100%">
          <el-input size="medium" v-model="formData.sort"></el-input>
        </el-form-item>

        <el-form-item label="编码：" style="width: 100%">
          <el-input size="medium" v-model="formData['function_code']"></el-input>
        </el-form-item>

        <el-form-item label="类型：" style="width: 100%">
          <el-radio-group v-model="formData.type">
            <el-radio label="0">目录</el-radio>
            <el-radio label="1">菜单</el-radio>
            <el-radio label="2">路由</el-radio>
            <el-radio label="3">按钮</el-radio>
          </el-radio-group>
        </el-form-item>

        <div style="display: flex;justify-content: center">
          <el-button @click="onCancel">取 消</el-button>
          <el-button type="primary" @click="onSubmit">确 定</el-button>
        </div>


      </el-form>
    </el-dialog>

  </div>
</template>

<script>
import TableTitle from "@/components/common/TableTitle.vue"
import Perm from "@/api/permission.js"
import {message_success} from "../../../../utils/helpers";

export default {
  name: "PermissionIndex",
  components: {
    TableTitle
  },
  data() {
    return {
      loading: false,
      tableData: [],
      formData: {},
      permission_id: "",
      total: 10,
      params: {
        current_page: 1,
        per_page: 10
      },
      dialogVisible: false,
      permissionOptions: []
    }
  },
  mounted() {
    this.getList();
    this.getParentTree();
  },
  methods: {
    changePage(pages) {
    },
    getParentTree() {
      Perm.tree()
        .then(({data}) => {
          if (data.code == 200) {
            this.permissionOptions = data.data;
          }
        })
    },
    getList() {
      if (this.hasAuth('sys:permission:search')) {
        Perm.list()
            .then(({data}) => {
              if (data.code == 200) {
                this.tableData = data.data
              }
            })
      }
    },
    handleAdd() {
      this.formData = { parent_id: "0", type: "1" }
      this.dialogVisible = true
    },
    handleEdit(row) {
      Perm.getOne({
        "current_page": 1,
        "per_page": 10,
        "id": row.id
      })
        .then(({data}) => {
          if (data.code == 200) {
            this.formData = data.data.data[0]
            console.log(this.formData)
          }
        })
      this.dialogVisible = true
    },
    handleDelete(row) {
      Perm.del({ id: row.id })
        .then(({data}) => {
          console.log(data)
          if (data.code == 200) {
            this.getList();
            this.getParentTree();
          }
        })
    },
    onCancel() {
      this.formData = {}
      this.dialogVisible = false
    },
    onSubmit() {
        // saveOrUpdate
      this.formData.sort = parseInt(this.formData.sort)
        Perm.saveOrUpdate(this.formData.id ? "edit":"add", this.formData)
            .then(({ data }) => {
              if (data.code == 200) {
                this.dialogVisible = false
                message_success("操作成功")
                this.getList();
                this.getParentTree();
              }
            })
    }
  }
}
</script>

<style scoped>

</style>