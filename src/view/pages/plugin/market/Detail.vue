<template>
    <el-dialog title="详情页面" :visible.sync="dialogVisible" width="80%">
        <div v-loading="isLoading">
            <iframe ref="frameRef" style="width: 100%;height: calc(100vh - 200px);border: 0px;margin:0;background: #fff"></iframe>
        </div>
    </el-dialog>
</template>

<script>
import { handleServerErrorMsg } from '../../../../utils/helpers'

export default {
  components: {},
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    url: {
        type: String,
        default: ""
    }
  },
  data() {
    return {
        isLoading: false
    }
  },
  computed: {
    dialogVisible: {
        get() {
            return this.visible
        },
        set(val) {
            this.$emit('update:visible', val)
        }
    }
  },
  watch: {
    dialogVisible: {
        handler(val) {
            if (val) {
                this.isLoading = true
                this.$nextTick(() => {
                    const myFrame = this.$refs.frameRef;
                    console.log("myFrame", this.url)
                    myFrame.contentWindow.location = this.url
                    this.isLoading = false
                })
            }
        },
        immediate: true
    },
    // url: {
    //     async handler(val) {
    //         console.log("url", val)
    //         if (!val) return;
    //         await this.$nextTick();
    //         let myIframe = document.getElementById("frame");
    //         console.log("myIframe", val)
    //         myIframe.contentWindow.location = val
    //     },
    //     immediate: true
    // }
  },
  methods: {}
}
</script>
<style lang="scss" scoped>
</style>