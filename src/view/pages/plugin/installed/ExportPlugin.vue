
<template>
  <div>
    <el-dialog class="el-dark-dialog el-table-transparent" :title="$t('PLUGIN.TAB1_CONTENT.TITLE')" :visible.sync="dialogVisible" width="30%">
        <el-row >
          <div style="margin-bottom: 10px;display: flex;justify-content: space-between">
  
          </div>
        </el-row>
        <el-row>
          <el-input class="el-dark-input" type="textarea" :rows="24" :placeholder="$t('PLUGIN.TAB1_CONTENT.PLACEHOLDER1')" v-model="exportPluginJson"></el-input>
        </el-row>
  
        <span slot="footer" class="dialog-footer">
          <el-button  @click="dialogVisible = false">{{ $t('PLUGIN.TAB1_CONTENT.CANCEL') }}</el-button>
          <el-button type="primary" class="el-button--indigo" @click="handleExport">{{ $t('PLUGIN.TAB1_CONTENT.EXPORT') }}</el-button>
          <el-button type="primary" class="el-button--indigo"
                     v-clipboard:copy="exportPluginJson"
                     v-clipboard:success="onCopy"
                     v-clipboard:error="onError"
          >{{ $t('PLUGIN.TAB1_CONTENT.PLACEHOLDER2') }}</el-button>
        </span>
      </el-dialog>
  </div>
</template>

<script>
export default {
  components: {},
  props: {
    visible: {
        type: [Boolean],
        default: false
    },
    jsonObj: {
        type: [Object, String],
        default: "{}"
    }
  },
  computed: {
    dialogVisible: {
        get() {
            return this.visible;
        },
        set(val) {
            this.$emit("update:visible", val);
        }
    }
  },
  watch: {
    jsonObj: {
        handler(newValue) {
            if (newValue) {
                if (typeof newValue === "object") {
                    this.exportPluginJson = JSON.stringify(newValue, null, 4);
                } else {
                    this.exportPluginJson = JSON.stringify(JSON.parse(newValue), null, 4);
                }
            }
        }
    }
  },
  data() {
    return {
        exportPluginJson: ""
    }
  },
  methods: {
    /**
     * 导出
     */
     handleExport() {

    },
    /**
     * 剪贴板拷贝成功
     * @param e
     */
     onCopy(e) {
      message_success("复制成功！")
    },

    /**
     * 剪贴板拷贝失败
     * @param e
     */
    onError(e) {
      console.log(e)
    }
  }
}
</script>
<style lang="scss" scoped>
</style>