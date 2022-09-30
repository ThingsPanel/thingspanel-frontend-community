<template>
  <el-dialog class="el-dark-dialog el-dark-input" title="绑定插件" :visible.sync="showDialog" width="50%">
    <div class="container-fluid">
      <el-row :gutter="40">
        <el-col :span="6">
          <el-card>
<!--            <el-input class="el-dark-input"></el-input>-->
            <el-tree class="el-dark-tree plugin-binding-tree"
                     :data="pluginTree" :props="{ children: 'device_model', label: 'model_name'}"
                      @node-click="nodeClick"></el-tree>
          </el-card>
        </el-col>

        <el-col :span="18">
          <tsl-editor class="tsl-editor" :data="tslData"></tsl-editor>
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
import {message_error, message_success} from "../../../utils/helpers";

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
.tsl-editor {
  margin: 20px 10px 10px 10px;
  ::v-deep .el-table--border {
    border-bottom: 1px solid #fff;
  }
}
::v-deep .el-dialog {
  height: 800px;
  .container-fluid {
    height: 600px;
  }
  .el-card {
    height: 100%;
    //background-color: #1a2f73;
    background: #273775;
    border: 0;
    color: #fff;
    overflow-y: auto;
  }
  .plugin-binding-tree {
    height: 540px;
  }

  .el-alert {
    border-radius: 0;
  }

}

</style>