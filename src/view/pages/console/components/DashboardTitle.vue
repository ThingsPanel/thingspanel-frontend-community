<template>
    <div @dblclick="handleDblClick">
        <span class="title" v-if="inputMode==='show'">{{ textValue }}</span>
        <el-input v-else class="edit-title" size="mini" ref="inputRef" v-model="textValue" 
            @blur="handleChange"  @keyup.enter.native="handleChange"></el-input>
    </div>
</template>

<script>
import { message_error } from "@/utils/helpers.js";
export default {
  components: {},
  props: {
    value: {
        type: [String],
        default: ""
    },
    mode: {
        type: [String],
        default: "view"
    }
  },
  data() {
    return {
        inputMode: "show",
        textValue: ""
    }
  },
  watch: {
    value: {
        handler(newValue) {
            if (newValue) {
                this.textValue = newValue;
            }
        },
        immediate: true
    }
  },
  methods: {
    async handleDblClick() {
        // 如果是编辑模式
        if (this.mode === "edit") {
            this.inputMode = "input";
            await this.$nextTick();
            this.$refs.inputRef.focus();
        }
    },
    handleChange() {
        try {
            if (this.textValue === "") throw new Error("图表名称不能为空!");
            this.$emit("update:value", this.textValue);
            this.inputMode = "show";
        }
        catch(err) {
            message_error(err.message);
            this.$refs.inputRef.focus();
        }
        
    }

  }
}
</script>
<style lang="scss" scoped>
.title {
    display: flex;
    align-items: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #fff;
    text-align: center;
    margin-top: 10px;
    margin-left: 10px;
    margin-bottom: 10px;
    font-size: 18px;
  }
.edit-title{
    display: flex;
    align-items: center;
    margin-top: 4px;
    margin-left: 4px;
    z-index: 99;
}
</style>