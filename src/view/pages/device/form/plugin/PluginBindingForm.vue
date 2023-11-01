<template>
  <el-dialog class="el-dark-dialog el-dark-input" :title="$t('DEVICE_MANAGEMENT.BINDDEVICEPLUG')" :visible.sync="showDialog" width="1000px">
    <div class="container-fluid">
      <el-row :gutter="40">
        <el-col :span="6" >
          <div class="tree-div" style="border-right: 4px solid #263373">
            <el-tree v-if="showDialog" ref="tree" class="el-dark-tree plugin-binding-tree"  :default-expanded-keys="defaultExpandKeys"
                     node-key="id"
                     :data="pluginTree" :props="{ children: 'device_model', label: 'model_name'}"
                     @node-click="nodeClick"></el-tree>
          </div>
        </el-col>

        <el-col :span="18">
          <tsl-editor class="tsl-editor" :show-view="false" :show-create="true" :data="tslData" @gotoPlugin="handleGotoPlugin"></tsl-editor>
        </el-col>
      </el-row>

    </div>

    <span slot="footer" class="dialog-footer">
        <el-button type="cancel" @click="showDialog = false">{{ $t('DEVICE_MANAGEMENT.CANCEL') }}</el-button>
        <el-button type="save" @click="handleSubmit">{{ $t('DEVICE_MANAGEMENT.SAVE') }}</el-button>
      </span>
  </el-dialog>
</template>

<script>
import {computed, defineComponent, nextTick} from "@vue/composition-api";
import { ref } from "@vue/composition-api/dist/vue-composition-api";
import PluginAPI from "@/api/plugin.js"
import {device_update} from "@/api/device";
import {message_success} from "@/utils/helpers";
import useRoute from "@/utils/useRoute";

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
    let {router} = useRoute()


    const tree = ref(null);
    let defaultExpandKeys = ref([]);

    let showDialog = computed({
      get() {
        tslData.value = {};
        if (props.dialogVisible) {
          // 插件id
          const pluginId = props.device_item.type;
          if (!pluginId) return props.dialogVisible;
          // 回显已绑定插件
          defaultExpandKeys.value.push(pluginId);
          nextTick(() => {
            tree.value.setCurrentKey(pluginId);
          })
          getPluginData(pluginId);
        } else {
          defaultExpandKeys.value = [];
        }
        return props.dialogVisible;
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
    function getPluginList() {
      PluginAPI.tree({})
          .then(({data}) => {
            if (data.code == 200) {
              pluginTree.value = data.data
            }
          })
    }
    getPluginList();


    let tslData = ref({});
    let pluginId = "";
    /**
     * 选择下拉列表后，在table中显示物模型数据
     * @param node
     */
    function nodeClick(node) {
      if (!node["dict_value"]) {
        // 通过插件id获取插件数据
        getPluginData(node.id)
      }
    }

    /**
     * 通过插件id获取插件数据
     * @param pluginId
     */
    function getPluginData(pId) {
      pluginId = pId;
      PluginAPI.page({"current_page": 1, "per_page": 10, "id": pId})
          .then(({data}) => {
            if (data.code == 200) {
              tslData.value = JSON.parse(data.data.data[0].chart_data).tsl
            }
          })
    }

    /**
     * 绑定插件
     */
    function handleSubmit() {
      this.showDialog = false;
      let data = { id: id.value, type: pluginId }
      device_update(data)
        .then(({data}) => {
          if (data.code == 200) {
            message_success("绑定成功！")
            this.$emit("submit")
          }
        })
        .catch(err => {})
    }

    function handleGotoPlugin() {
      router.push({ name: "Market", query: { tab: "deviceEditor"} })

    }

  return {
    tree,
    defaultExpandKeys,
    pluginTree,
    showDialog,
    tslData,
    nodeClick,
    handleSubmit,
    handleGotoPlugin
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
      //border-top: 1px solid #324899;
      //border-bottom: 1px solid #324899;
    }
  }
  .el-form-item:nth-child(2) {
    //background-color: #314694;
    overflow-y: auto;

    .el-table--border {
      border: 1px solid #314694;
    }
    .el-table--border::after, .el-table--group::after, .el-table::before {
      background-color: #314694;
    }
    .el-table--border .el-table__cell, .el-table__body-wrapper .el-table--border.is-scrolling-left~.el-table__fixed {
      border: 1px solid #314694;
    }
    .el-table__empty-block {
      border-top: 1px solid #314694;
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
    .is-current .el-tree-node__content {
      //background-color: #cb1667 !important;
      background-color: #1c2754 !important;
    }
  }

  .el-alert {
    border-radius: 0;
  }

}

</style>