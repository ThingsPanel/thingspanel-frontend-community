<template>
  <div class="dialog-content">
    <el-dialog :visible.sync="dialogVisible" @close="handleClose" :title="$t('COMMON.AI_ASSISTANT')"
      :modal="false" show-close append-to-body custom-class="dialog"
      >
      <div style="height: 630px; overflow: auto;padding: 30px 0 30px 30px;">
        <div v-if="content" ref="scrollDiv" style="overflow-y: auto; max-height: 570px; width: 100%; display: flex; flex-direction: column;">
          <div v-for="(item, index) in content" :key="index" 
              :class="['message_common', item.user === 'ai' ? 'ai-message' : 'your-message']">
            {{ item.message }}
          </div>
        </div>
      </div>
      <div style="height: 70px; overflow: auto; padding: 18px 0 0px 10px; background-color:#2d3d88">
        <el-row>
          <el-col  :xl=19 :lg=16 :md=14>
              <el-input style="" size="medium" v-model="userInput" @keyup.enter.native="enterSend($event)"></el-input>
          </el-col>
          <el-col  :xl=3 :lg=5 :md=5>
            <el-button @click="sendUserMessage" type="success" style="margin: 0 12% 0 15%; min-width: 80px" size="medium">{{ $t('COMMON.SEND') }}</el-button>
          </el-col>
          <el-col  :xl=1 :lg=2 :md=2>
            <el-button @click="handleRefresh" type="border" style="margin-left:10%; min-width: 45px; border-color:#747474" size="small" icon="el-icon-refresh-right"></el-button>
          </el-col>
        </el-row>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { websocket } from "@/utils/websocket";
import { ws_url } from "@/api/LocalUrl"
import JwtService from "@/core/services/jwt.service";

export default {
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      socket: null,
      userInput: '',
      content: [],
    };
  },
  computed: {
    dialogVisible: {
      get() {
        if (this.visible) {
          if (!this.socket) {
            this.initSocket();
            this.loadConversation();
            
            setInterval(() => {
              if (!this.socket) {
                return
              }
              this.socket.send("ping", "string");
            }, 30000);
          }
        }else {
          // this.closeSocket();
          // clearInterval();
        }
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    },
  },
  mounted() {
  },
  updated() {
    this.handleScrollBottom();
  },
  beforeDestroy() {
    this.closeSocket();
    clearInterval();
  },
  methods: {
    openDialog() {
      this.visible = true;
    },
    handleClose() {
      this.dialogVisible = false;
    },
    enterSend(event) {
      this.sendUserMessage();
      // if (!event.ctrlKey) {
      //   event.preventDefault();
      // } else {
      //   this.userInput += '\n';
      // }
    },
    handleRefresh() {
      this.content = [];
      localStorage.removeItem('chatHistory');
      this.closeSocket();
      this.initSocket();
      this.loadConversation();
    },
    sendUserMessage() {
      if (!this.socket) {
        return
      }
      this.socket.send({ message: this.userInput })
      this.userInput = '';
    },
    /**
     * 加载已有对话
     */
    loadConversation() {
      // 这里是localStorage中存储聊天历史的键
      const CHAT_STORAGE_KEY = 'chatHistory';
      const history = localStorage.getItem(CHAT_STORAGE_KEY);
      this.content = history ? JSON.parse(history) : [];
      if(this.content.length > 0) {
        this.handleScrollBottom();
      }
    },
    /**
     * 保存对话
     */
    saveConversation(message) {
      this.content.push(message);
      localStorage.setItem('chatHistory', JSON.stringify(this.content));
      this.handleScrollBottom();
    },
    /**
     * 更新组件的值
     */
    initSocket() {
      if (this.socket) {
        return
      }
      this.closeSocket();
      this.socket = new websocket(ws_url + "/ws/ai");
      this.socket.init((event) => {
      });
      this.socket.onReady(() => {
        const token = JwtService.getToken();
        this.socket.send({ token })
      })

      this.socket.onMessage((result) => {
        try {
          if (result.indexOf('You: ') > -1) {
            this.saveConversation({ user: 'you', message: typeof result === 'string' ? result.slice(5): result })
          } else if (result.indexOf('AI: ') > -1){
            this.saveConversation({ user: 'ai', message: typeof result === 'string' ? result.slice(4) : result })
          } else {
            this.saveConversation({ user: 'ai', message: result })
          }
        } catch (err) {
          console.error(err)
        }
      })
    },
    closeSocket() {
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
    },
    // 滚动到底部
    handleScrollBottom() {
      this.$nextTick(() => {
        let scrollElem = this.$refs.scrollDiv;
        if (!scrollElem) {
          return;
        }
        scrollElem.scrollTop = scrollElem.scrollHeight;
      });
    },
  }
};
</script>

<style>
.dialog{
  position: fixed;
  width: 40%;
  padding: 0;
  margin: 0;
  bottom: 0;
  right: 0;
  .el-dialog__body {
    background-color: #101530; /* 您想要的颜色 */
    padding: 0;
  };
  .el-dialog__header {
    background-color: #2c3b84; /* 您想要的颜色 */
  };
}

/* 聊天框整体样式 */
.chat-container {
  border-radius: 8px; /* 圆角 */
  overflow-y: auto; /* 内容超出时可以滚动 */
  max-height: 400px; /* 最大高度，根据需要调整 */
}

.message_common {
  width: fit-content;
  max-width: 80%; /* 最大宽度，根据需要调整 */
  margin-bottom: 10px; /* 消息之间的间距 */
  padding: 10px; /* 消息内边距 */
  border-radius: 5px; /* 圆角 */
  white-space: pre-line;
  font-family: 'Roboto', sans-serif;
}

/* AI发送的消息样式 */
.ai-message {
  background-color: #33469b; /* AI消息背景颜色 */
  text-align: left; /* 左对齐文本 */
  align-self: flex-start; /* 左对齐文本 */
  color: #fff; /* 文字颜色 */
}

/* 用户发送的消息样式 */
.your-message {
  background-color: #161e43; /* 用户消息背景颜色 */
  text-align: right; /* 右对齐文本 */
  color: #fff; /* 文字颜色 */
  align-self: flex-end; /* 右对齐文本 */
  margin-right: 20px;
}
</style>
