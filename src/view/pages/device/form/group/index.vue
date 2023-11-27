<template>
  <div class="rounded card p-4" style="margin-bottom: 80px">
    <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
      <el-col :span="12">
        <TableTitle>分组管理</TableTitle>
      </el-col>

      <el-col :span="12" class="px-2 text-right">
      </el-col>
    </el-row>

    <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
      <el-col :span="12">
        <el-input placeholder="输入分组名称检索"></el-input>
      </el-col >
      <el-col :span="2">
        <el-button type="border" size="medium" @click="getList">查询</el-button>
      </el-col>

      <el-col :span="10" class="px-2 text-right">
        <el-button size="medium" type="border" @click="handleCreateGroup">创建分组</el-button>
      </el-col>
    </el-row>

    <!-- 表 start -->
    <el-form class="inline-edit">
      <el-table v-bind="tableSettings">
        <!-- 复选框 -->
        <!-- <el-table-column type="selection" width="55" /> -->
        <!-- 序号 -->
        <el-table-column :label="$t('VISUALIZATION.NO')" type="index" align="left" min-width="110" width="200">
          <template v-slot="scope">
            <span>{{ (params.current_page - 1) * 10 + scope.$index + 1 }}</span>
          </template>
        </el-table-column>

        <!-- 分组名称 -->
        <el-table-column label="分组名称" prop="name" align="left" />

        <!-- 创建时间 -->
        <!-- <el-table-column label="创建时间" prop="created_at" align="left">
          <template v-slot="scope">
            {{ scope.row.created_at ? formatDate(scope.row.created_at) : "" }}
          </template>
        </el-table-column> -->

        <!-- 操作 -->
        <el-table-column align="left" :label="$t('VISUALIZATION.OPERATION')" width="230">
          <template v-slot="scope">
            <div style="text-align: left">
              <!-- 编辑 -->
              <el-button type="indigo" size="mini" @click="handleEditGroup(scope.row)">{{
                $t('VISUALIZATION.EDIT') }}</el-button>
              <!-- 删除 -->
              <el-popconfirm :confirm-button-text="$t('COMMON.CONFIRM')" :cancel-button-text="$t('COMMON.CANCEL')"
                style="margin-left: 10px" :title="$t('VISUALIZATION.TEXT44')" @confirm="handleDelGroup(scope.row)">
                <el-button slot="reference" type="danger" size="mini">{{ $t('VISUALIZATION.DELETE')
                }}</el-button>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>

        <template #empty>
          <div>{{ $t('COMMON.TABLE_NO_DATA') }}</div>
        </template>
      </el-table>
    </el-form>
    <!-- 表 end -->

    <!-- 分页 start -->
    <!-- <div class="text-right py-3">
      <el-pagination background layout="prev, pager, next" :total="total" :current-page.sync="params.current_page"
        :page-size="params.per_page" @current-change="getList"></el-pagination>
    </div> -->
    <!-- 分页 end -->

    <!-- 创建分组对话框 start -->
    <el-dialog class="el-dark-dialog" :visible.sync="createDialogVisible" v-bind="dialogSettings" v-on="dialogEvents">
      <el-form class="console-create-form el-dark-input" label-position="left" label-width="80px" ref="createFormRef"
        :model="formData" :rules="formRules">

        <el-form-item label="父分组">
          <el-input class="el-dark-input search-input" placeholder="输入分组名称检索" v-model="formData.filterText"></el-input>
          <el-tree ref="groupTree" v-bind="groupTreeData" @node-click="handleNodeClick"></el-tree>
        </el-form-item>

        <!-- 分组名称 -->
        <el-form-item label="分组名称" prop="name">
          <el-input style="width: 280px" v-model="formData.name"></el-input>
        </el-form-item>



      </el-form>
      <div class="dialog-footer">
        <el-button type="cancel" @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </div>
    </el-dialog>
    <!-- 创建分组对话框 end -->

  </div>
</template>

<script>
import TableTitle from "@/components/common/TableTitle.vue";
import { asset_list_c, asset_add, asset_update, asset_delete } from "@/api/asset";
import { message_success } from "@/utils/helpers.js"
export default {
  components: { TableTitle },
  props: {},
  data() {
    return {
      // 表格设置
      tableSettings: {
        rowKey: "id",
        // 表格数据
        data: [],
        // 配置
        treeProps: {
          children: 'children',
          hasChildren: 'hasChildren'
        },
        // 加载中
        loading: false,
        // 默认全部展开
        defaultExpandAll: true
      },
      // 列表总条数
      total: 0,
      // 分页参数
      params: {
        current_page: 1,
        per_page: 9999
      },
      // 表单数据
      formData: {
        id: "",
        name: "",
        parent_id: "",
        filterText: ""
      },
      // 表单验证
      formRules: {},
      // 对话框设置
      dialogSettings: {
        title: "创建分组",
      },
      // 对话框事件
      dialogEvents: {
        open: this.initDialog
      },
      // 是否显示对话框
      createDialogVisible: false,
      // 对话框中的分组树
      groupTreeData: {
        class: "el-dark-tree",
        // 树数据
        data: [],
        // 唯一标识
        nodeKey: "id",
        highlightCurrent: true,
        checkOnClickNode: true,
        // 默认展开所有节点
        defaultExpandAll: false,
        defaultExpandedKeys: [],
        // 默认选中的节点
        defaultCheckedKeys: [],
        // 是否每次只打开一个同级树节点
        accordion: true,
        // 筛选函数
        filterNodeMethod: (value, data) => {
          // console.log("filterNodeMethod", data.name.toLowerCase(),value.toLowerCase())
          if (!value) return true;
          return data.name.indexOf(value) !== -1;
        },
        // 配置选项
        props: {
          children: 'children',
          label: 'name'
        }
      }
    }
  },
  watch: {
    $route: {
      handler(val) {
        this.params.business_id = val.query.business_id;
        this.getList();
      }, immediate: true
    },
    "formData.filterText": {
      handler(val) {
        if (val !== undefined)
          this.$refs.groupTree.filter(val);
      }
    }
    
  },
  mounted() {
  },
  methods: {
    /**
     * @description: 获取分组列表
     * @return {*}
     */
    getList() {
      this.tableSettings.loading = true;
      asset_list_c(this.params)
        .then(({ data: result }) => {
          if (result.code === 200) {
            if (result.data?.data) {
              this.total = result.data.total;
              this.tableSettings.data = this.getGroupTree(result.data.data);
              console.log("getList", this.tableSettings.data)
            } else {
              this.tableSettings.data = []
            }
          }
        })
        .finally(() => {
          this.tableSettings.loading = false;
        })
    },
    /**
     * @description: 创建分组
     * @return {*}
     */
    handleCreateGroup() {
      this.formData = {
        id: "",
        name: "",
        parent_id: ""
      };
      this.createDialogVisible = true;
    },
    /**
     * @description: 编辑分组
     * @param {*} item
     * @return {*}
     */
    handleEditGroup(item) {
      // 回显
      this.formData = { ...item };
      this.groupTreeData.defaultExpandedKeys =  [item.parent_id];
      // 分组树默认选中父分组
      // this.groupTreeData.defaultCheckedKeys = [item.parent_id];
      this.$nextTick(() => {
        this.$refs.groupTree.setCurrentKey(item.parent_id);
      });
      this.createDialogVisible = true;
    },

    handleDelGroup(item) {
      console.log("handleDelGroup", item)
      asset_delete({ id: item.id })
        .then(({ data: result }) => {
          if (result.code === 200) {
            message_success("删除成功!");
            this.getList();
          }
        })
    },
    /**
     * @description: 初始化创建分组对话框
     * @return {*}
     */
    initDialog() {
      // 分组树
      asset_list_c({ business_id: this.params.business_id, current_page: 1, per_page: 9999 })
        .then(({ data: result }) => {
          if (result.code === 200) {
            this.groupTreeData.data = [{
              id: "0",
              name: "/",
              tier: 1, 
              children: this.getGroupTree(result.data.data)
            }];
          }
        })
      this.dialogSettings.title = this.formData.id ? "编辑分组" : "创建分组";
    },
    /**
     * @description: 选择父分组节点
     * @param {*} node
     * @return {*}
     */
    handleNodeClick(node) {
      this.$refs.groupTree.setCheckedKeys([]);
      this.formData.parent_id = node.id;
    },
    /**
     * @description: 提交表单
     * @return {*}
     */
    async handleSubmit() {
      const data = { ...this.formData, business_id: this.params.business_id };
      data.parent_id = data.parent_id || "0";
      data.tier = data.tier || 2
      const { data: result } = await (this.formData.id ? asset_update(data) : asset_add(data));
      if (result.code === 200) {
        message_success("保存成功!");
        this.createDialogVisible = false;
        this.getList();
      }
    },  
    /**
     * @description: 获取分组树
     * @param {*} data
     * @return {*}
     */
    getGroupTree(data) {
      if (!data)
        return [];
      const idToNodeMap = {};
      const tree = [];

      // 建立映射, 根目录的level为1, 下一层级为2
      data.forEach(item => {
        idToNodeMap[item.id] = { ...item, children: [], tier: 2  };
      });
      //构建树形结构
      data.forEach(item => {
        if (item.parent_id === "0") {
          tree.push(idToNodeMap[item.id]);
        } else {
          idToNodeMap[item.id].tier = idToNodeMap[item.parent_id].tier + 1;
          idToNodeMap[item.parent_id].children.push(idToNodeMap[item.id]);
        }
      });
      return tree;
    }
  }
}
</script>
<style lang="scss" scoped>
::v-deep .el-dark-tree .el-tree-node__content {
  margin-top: 2px;

  .el-tree-node__label {
    font-size: 15px;
  }

}

::v-deep .el-dark-tree .is-current .el-tree-node__content {
  background-color: #5b92ff !important;
}

::v-deep .el-tree-node.is-focusable.is-checked {
  background-color: #5b92ff !important;
  color: #ffffff;
}

.dialog-footer {
  text-align: center;
}</style>