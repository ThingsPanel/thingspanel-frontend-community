<template>
  <div class="rounded p-4 card no-border">
    <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
      <el-col :span="12">
        <TableTitle>{{ $t("SYSTEM_MANAGEMENT.ROLE_MANAGEMENT.MANAGEMENT")}}</TableTitle>
      </el-col>
      <el-col :span="12" class="px-2 text-right">
        <el-button size="medium" type="indigo" @click="dialogVisible"
          >{{ $t("SYSTEM_MANAGEMENT.ROLE_MANAGEMENT.ADDROLE")}}</el-button
        >
      </el-col>
    </el-row>
    <el-form class="inline-edit">
      <el-table :data="tableData">
        <el-table-column :label="$t('SYSTEM_MANAGEMENT.ROLE_MANAGEMENT.NO')" type="index">
          <template v-slot="scope">
            <span>{{ (page - 1) * 10 + scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="role_name" :label="$t('SYSTEM_MANAGEMENT.ROLE_MANAGEMENT.ROLENAME')" width="200px">
          <template v-slot="scope">
            <!-- 新建或者编辑 -->
            <el-form-item v-if="inputVal == scope.row.id">
              <el-input
                size="medium"
                v-model="scope.row.role_name"
                v-focus
                @keydown.enter.native="handleSave(scope.row)"
                class="inputStyle"
              ></el-input>
            </el-form-item>
            <span
              v-else
              class="cursor-pointer"
              @click="showDevice(scope.row)"
              >{{ scope.row.role_name }}</span
            >
          </template>
        </el-table-column>
        <el-table-column prop="role_describe" :label="$t('SYSTEM_MANAGEMENT.ROLE_MANAGEMENT.ROLEDESCRIPTION')">
          <template v-slot="scope">
            <!-- 新建或者编辑 -->
            <el-form-item v-if="inputVal == scope.row.id">
              <el-input
                size="medium"
                v-model="scope.row.role_describe"
                v-focus
                @keydown.enter.native="handleSave(scope.row)"
                class="inputStyle"
              ></el-input>
            </el-form-item>
            <span
              v-else
              class="cursor-pointer"
              @click="showDevice(scope.row)"
              >{{ scope.row.role_describe }}</span
            >
          </template>
        </el-table-column>
        <el-table-column prop="id" :label="$t('SYSTEM_MANAGEMENT.ROLE_MANAGEMENT.PERMISSIONMANAGEMENT')">
          <template v-slot="scope">
            <el-button
              size="mini"
              type="indigo"
              @click="handle_quanxian(scope.row)"
              :disabled="!hasAuth('sys:role:assign')"
              >{{ $t("SYSTEM_MANAGEMENT.ROLE_MANAGEMENT.PERMISSIONMANAGEMENT")}}</el-button
            >
          </template>
        </el-table-column>

        <el-table-column
          prop="actions"
          :label="$t('SYSTEM_MANAGEMENT.ROLE_MANAGEMENT.OPERATION')"
          align="center"
          width="210px"
        >
          <template v-slot="scope">
            <el-form-item v-if="inputVal == scope.row.id">
              <el-button
                size="mini"
                type="indigo"
                @click="handle_sever(scope.row)"
                >{{ $t("SYSTEM_MANAGEMENT.SAVE")}}</el-button>
                <el-button size="mini" type="default" class="butStyle" @click="handleCancel(scope.row)"
                  >{{ $t("SYSTEM_MANAGEMENT.CANCEL")}}</el-button>
            </el-form-item>
            <el-form-item v-else>
              <el-button
                size="mini"
                type="indigo"
                :disabled="!hasAuth('sys:role:edit')"
                @click="handle_launch(scope.row)"
                >{{ $t("SYSTEM_MANAGEMENT.EDIT")}}</el-button
              >
              <el-popconfirm
                :title="$t('SYSTEM_MANAGEMENT.TITLE4')"
                @confirm="handle_del(scope.row)"
              >
                <el-button
                  slot="reference"
                  size="mini"
                  type="danger"
                  class="butStyle"
                  :disabled="!hasAuth('sys:role:del')"
                >{{ $t("SYSTEM_MANAGEMENT.DELETE")}}</el-button
                >
              </el-popconfirm>
            </el-form-item>
          </template>
        </el-table-column>
      </el-table>
    </el-form>
    <div class="text-right py-3">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :current-page.sync="page"
        :page-size="per_page"
        @current-change="page_change">
      </el-pagination>
    </div>
    <div class="home">
      <el-drawer custom-class="drawer-config"
        :title="$t('SYSTEM_MANAGEMENT.ROLE_MANAGEMENT.PERMISSIONEDIT')"
        :visible.sync="drawer"
        direction="rtl"
        size="400px"
        :with-header="true"
        :show-close="true"
        ref="closeDrawer"
      >
        <div class="dividerLine">
          <el-divider></el-divider>
        </div>
        <div class="treeStyle">
          <el-tree
            ref="permTree"
            :data="treeData"
            :check-strictly="true"
            show-checkbox
            node-key="id"
            :default-checked-keys="treeCheckeds"
            :props="defaultProps"
          >
          </el-tree>
        </div>
        <div>
          <div class="footer" style="text-align: center;">
            <el-button size="small " @click="closeDrawerClose"  class="buttStyle">{{ $t("SYSTEM_MANAGEMENT.CANCEL")}}</el-button>
            <el-button size="small" type="indigo" @click="jurisdiction"

            >{{ $t("SYSTEM_MANAGEMENT.SAVE")}}</el-button
            >
          </div>
        </div>
      </el-drawer>
    </div>
  </div>
</template>

<script>
import AUTH from "@/core/services/store/auth.module";
import ApiService from "@/core/services/api.service";
import JwtService from "@/core/services/jwt.service";
import CreateForm from "@/view/pages/transpond/CreateForm.vue";
import UpdateForm from "@/view/pages/transpond/UpdateForm.vue";
import TableTitle from "@/components/common/TableTitle.vue";
import { message_success } from "@/utils/helpers";
import Perm from "@/api/permission"
import {
  defineComponent,
  reactive,
  ref,
  onMounted,
  getCurrentInstance,
} from "@vue/composition-api";
import {message_error} from "@/utils/helpers";
import i18n from "@/core/plugins/vue-i18n"
import {local_url} from "@/api/LocalUrl";

export default defineComponent({
  name: "Home",
  components: {
    CreateForm,
    UpdateForm,
    TableTitle,
  },

  setup(props, context) {
    // 字段定义
    let inputVal = ref("0");
    let inputShow = ref(false);
    const tableData = ref([]);
    const treeData = ref([]);
    const drawer = ref(false);
    const treeCheckeds = ref([]);
    let checkedKeyObj = {};
    const per_page = 10;
    const page = 1;
    const data_count= 2;
    const closeDrawer = ref(false);
    let defaultProps = ref({
      children: "children",
      label: data => i18n.t(data.title)
    });
    let paramsPage = reactive({
        page: page ? page : 1,
        limit: 10,
    })
    // 等同于 this
    const self = getCurrentInstance().proxy
    let total = ref(0)
    // 初始化获取数据
    onMounted(() => {
      sbdata();
      getAllPermissions();
    });

    // 初始化数据
    const sbdata = () => {
      let query = {
         current_page: paramsPage.page,
         per_page: paramsPage.limit
      }
      ApiService.post(local_url + "/api/user/role/list",query).then(({ data }) => {
        if (data.code == 200) {
          tableData.value = data.data.data;
          total.value = data.data.total; 
        }
      });
    };

    // 加载所有权限
    const getAllPermissions = () => {
      Perm.tree()
          .then(({data}) => {
            if (data.code == 200) {
              let user = JwtService.getCurrentUser();
              let tree = data.data;
              if (user && user.email != "super@super.cn") {

                tree.forEach(item => {
                  if (item.children && item.name == "SystemManagement") {
                    item.children.forEach(child => {
                        child.children && child.children.forEach(leaf => {
                          if (leaf.name == "AddPermission"
                              || leaf.name == "EditPermission"
                              || leaf.name == "DeletePermission"
                              || leaf.name == "DelUser"
                              || leaf.name == "EditPassword"
                              || leaf.name == "EditRole"
                              || leaf.name == "DelRole"
                          ) {
                            leaf.disabled = true;
                          }
                        })
                    })
                  }
                })
              }
              treeData.value = tree

            }
          })
    }

    // 获取指定角色的权限数据  /api/menu/tree
    const treeDateList = (item) => {
      const { id } = item
      treeCheckeds.value = [""];
      Perm.getPermissionsByRole({ role: id })
          .then(({data}) => {
            if (data.code == 200) {
              treeCheckeds.value = data.data || []
              // let treeData = data.data || []
              // self.$nextTick(() => {
              //   console.log("==============treeData=================")
              //   console.log(treeData)
              //   treeData.forEach(key => {
              //     var node = self.$refs.permTree.getNode(key);
              //     if (node.isLeaf) {
              //       self.$refs.permTree.setChecked(node, true)
              //     }
              //   })
              //   console.log("==============treeData=================")
              //
              // })
              self.$refs.permTree.setCheckedKeys(treeCheckeds.value);
            }
          })

    };

    // 信息编辑
    const handle_launch = (item) => {
      inputVal.value = item.id;
    };
    // 信息保存  /api/user/role/edit     /api/user/role/add
    const handle_sever = (item) => {
      if (item.role_name == "") {
        message_error("角色名称不能为空!")
        return;
      }
      inputVal.value = 1;
        if (item.id == "") {
          let query = {
            role_name: item.role_name,
            role_describe:item.role_describe
          }
          ApiService.post(local_url + "/api/user/role/add", query)
              .then(({ data }) => {
                  if (data.code == 200) {
                    message_success("添加成功");
                    sbdata();
                  }
                })
      } else {
        let query = {
          id: item.id,
          role_name: item.role_name,
          role_describe:item.role_describe
        };
        ApiService.post(local_url + "/api/user/role/edit", query).then(
          ({ data }) => {
            if (data.code == 200) {
              message_success("修改成功");
              sbdata();
            }
          }
        )
      }
    };
    // 删除信息   /api/user/role/delete
    const handle_del = (item) => {
      ApiService.post(local_url + "/api/user/role/delete", {
        id: item.id,
      }).then(({ data }) => {
        if (data.code == 200) {
          message_success("删除成功");
          sbdata();
        }
      });
    };
    // 权限管理
    const role_id = ref("");
    const handle_quanxian = (items) => {
      treeDateList(items);
      checkedKeyObj.role = items.id;
      drawer.value = true;
    };

    // 弹框取消
    const closeDrawerClose = () => {
      drawer.value = false;
    };
    // 权限选择  setChecked
    const checkChange = (items, value) => {
      // console.log("==============checkChange===================")
      // console.log(items)
      // console.log(value);
      // console.log("===============checkChange==================")
      // checkedKeyObj.functions = value.checkedKeys;

    };
    // 权限节点选择
    const setChecked = (key, checked, deep) => {
      // console.log("==============setChecked===================")
      //
      // console.log(key);
      //  console.log(checked);
      //   console.log(deep);
      // console.log("==============setChecked===================")

    };


    // 权限保存  /api/menu/role/edit
    const jurisdiction = () => {
      var halfCheckedKeys = self.$refs.permTree.getHalfCheckedKeys();
      var checkedKeys = self.$refs.permTree.getCheckedKeys();
      checkedKeyObj.functions = halfCheckedKeys.concat(checkedKeys)
      Perm.assignPermissions(checkedKeyObj)
        .then(({data}) => {
          message_success("保存成功!")
          drawer.value = false;
        })
      // ApiService.post(AUTH.local_url + "/menu/role/edit", checkedKeyObj).then(
      //   ({ data }) => {
      //     if (data.code == 200) {
      //       message_success("权限保存成功");
      //       drawer.value = false;
      //       sbdata();
      //     }
      //   }
      // );
    };
    // 分页
    const  page_change=(val)=>{
      setTimeout(()=>{
        paramsPage.page = val
        sbdata();
      }, 500)
    }
    // 新建
    const  dialogVisible =()=>{
      inputVal.value = ''
        tableData.value.unshift({
            id:"",// id
            role_describe: "",// 角色描述
            role_name: "",// 角色名称
            errors: {
                role_name: ""
            },
        })
      
    }
    // 创建
    const handleCreate =()=>{
        // 创建时添加一个空数据到 tableData
        tableData.value.unshift({
            id:"",//id
            role_describe: "",//角色描述
            role_name: "",//角色名称
        })
    }
    // 取消编辑或新建
    const  handleCancel = (item)=>{
      if (item.id == "") {
        let index = tableData.value.indexOf(item)
        tableData.value.splice(index, 1)
      } else {
        inputVal.value = ""
      }
    }
    return {
      paramsPage,
      handleCreate,
      handleCancel,
      dialogVisible,
      page_change,
      checkedKeyObj,
      role_id,
      checkChange,
      setChecked,
      jurisdiction,
      closeDrawerClose,
      treeDateList,
      sbdata,
      handle_launch,
      handle_sever,
      treeData,
      treeCheckeds,
      defaultProps,
      drawer,
      closeDrawer,
      handle_del,
      tableData,
      inputShow,
      inputVal,
      handle_quanxian,
      direction: "rtl", //这里设置抽屉从哪个方向滑出
      per_page,
      page,
      data_count,
      total
    };
  },
});
</script>

<style scoped lang="scss">
::v-deep .drawer-config {
  background-color: #263d8b;
  color: #ffffff;
  text-align: center;
  .el-drawer__header {
    color: #ffffff !important;
  }
}
.el-input__inner {
  color: aliceblue;
  background: #090944;
  height: 30px;
  
}
.el-input--medium .el-input__inner {
  height: 30px;
}
.home {
  .el-drawer {
    color: #fff !important;
    font-size: 14px;
    background: #263d8b;
    // outline: none;
    &__body {
      height: 100%;
      // overflow: hidden;
    }
  }
}
.butStyle {
  margin-left: 5px;
 
}
.treeStyle {
  width: 380px;
  //height: 450px;
  overflow:auto;
  height: calc(100% - 130px);
  padding: 0px 10px;
  border-radius:5px ;
  .el-tree {
    background: #263d8b;
    color: #5b92ff;
   

  }
}
.dividerLine {
  margin-top: -23px;
  .el-divider {
    background: #8181be;
  }
}
.el-tree-node__content {

    border-radius: 5px;
}
.el-tree-node__content:hover{
  background: #fff;
  border-radius: 5px !important;
}
.el-drawer__header{
  color: #fff;
}

.el-tree-node__content {
  .el-checkbox {
    margin: 0 auto 0 0;
  }
}

.el-tree-node{
  border-radius: 5px;
  margin-bottom: 10px;

}
.buttStyle{
  background: #263d8b;
}

.el-tree-node .is-current .is-focusable .is-checked{
  background: chocolate;
}
.el-table-transparent .el-button--default {
    color: #6988f0 !important;
    border: #6988f0 1px solid;
}
.footer {
  border-top: 2px solid #8181be;
  position: absolute;
  height: 100px;
  bottom: 0;
  left: 0;right: 0;
  margin: 0;
  padding-top: 20px;
}
</style>