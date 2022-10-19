<template>
  <el-dialog class="el-dark-dialog el-dark-input" title="绑定设备插件" :visible.sync="showDialog" width="1000px">
    <div class="container-fluid">
      <el-row :gutter="40">
        <el-col :span="6" >
          <div class="tree-div" style="border-right: 4px solid #263373">
            <el-tree class="el-dark-tree plugin-binding-tree"
                     :data="pluginTree" :props="{ children: 'device_model', label: 'model_name'}"
                     @node-click="nodeClick"></el-tree>
          </div>
        </el-col>

        <el-col :span="18">
          <tsl-editor class="tsl-editor" :show-view="false" :data="tslData"></tsl-editor>
        </el-col>
      </el-row>

    </div>

    <span slot="footer" class="dialog-footer">
        <el-button @click="showDialog = false">取 消</el-button>
        <el-button type="primary" @click="handleSubmit">确 定</el-button>
      </span>
  </el-dialog>
</template>

<script>
import {computed, defineComponent} from "@vue/composition-api";
import {reactive, ref} from "@vue/composition-api/dist/vue-composition-api";
import PluginAPI from "@/api/plugin.js"
import {device_update} from "@/api/device";
import {message_error, message_success} from "../../../../../utils/helpers";

export default defineComponent({
  name: "PluginBinding",
  props: {
    dialogVisible: {
      type: [Boolean],
      default: false
    },
    device_item: {
      type: [Object],
      default: () => {return {}}
    }
  },
  setup(props, context) {
    let showDialog = computed({
      get() {
        console.log("plugin_device_item", props.device_item)
        return !!props.dialogVisible;
      },
      set(val) {
        context.emit('update:dialogVisible', val)
      }
    })

    let id = computed({
      get() {
        return props.device_item.id;
      }
    })

    /**
     * 用于回显数据
     */
    function getPlugin() {

    }


    /**
     * 插件列表
     */
    let pluginTree = ref([])
    PluginAPI.tree({})
        .then(({data}) => {
          if (data.code == 200) {
            pluginTree.value = data.data
          }
        })

    let tslData = ref({});
    let pluginId = "";
    /**
     * 选择下拉列表后，在table中显示物模型数据
     * @param node
     */
    function nodeClick(node) {
      if (!node["dict_value"]) {
        // 插件
        pluginId = node.id;
        PluginAPI.page({"current_page": 1, "per_page": 10, "id": pluginId})
          .then(({data}) => {
            if (data.code == 200) {
              tslData.value = JSON.parse(data.data.data[0].chart_data).tsl
              console.log(tslData.value)
            }
          })
      }
    }

    /**
     * 绑定插件
     */
    function handleSubmit() {
      console.log("handleSubmit")
      this.showDialog = false;
      let data = { id: id.value, type: pluginId }
      console.log(data)
      device_update(data)
        .then(({data}) => {
          console.log(data)
          if (data.code == 200) {
            message_success("绑定成功！")
          }
        })
        .catch(err => {})
    }

  return {
    pluginTree,
    showDialog,
    tslData,
    nodeClick,
    handleSubmit
  }
}
})
</script>

<style scoped lang="scss">
::v-deep .tsl-editor {
  height: 100%!important;
  overflow-y: auto;
  .el-form-item:first-child {
    .el-form-item__content {
      padding-top: 6px;
      padding-bottom: 6px;
      border-top: 1px solid #324899;
      border-bottom: 1px solid #324899;
    }
  }
  .el-form-item:nth-child(2) {
    background-color: #314694;
    padding: 10px;
    overflow-y: auto;

    .el-table--border {
      border: 1px solid #2d3c88;
    }
    .el-table--border::after, .el-table--group::after, .el-table::before {
      background-color: #2d3c88;
    }
    .el-table--border .el-table__cell, .el-table__body-wrapper .el-table--border.is-scrolling-left~.el-table__fixed {
      border: 1px solid #2d3c88;
    }
  }

}
::v-deep .el-dialog {
  height: 800px;
  .container-fluid {
    height: 600px;
  }
  .tree-div {
    overflow-y: auto;
    overflow-x: auto;
    border-right: 4px solid #263373;
    padding: 0 10px 10px 10px;
  }

  .plugin-binding-tree {
    background-color:#2d3d88!important;
    height: 540px;
  }

  .el-alert {
    border-radius: 0;
  }

}

</style>