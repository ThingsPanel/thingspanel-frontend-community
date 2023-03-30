<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-29 14:39:42
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-30 10:00:11
 * @FilePath: \ThingsPanel-Backend-Vue\src\components\video\monitor\index.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <div class="video-control-container">
        <div class="player-box" id="player-box">
            <video-player class="player" ref="videoPlayer" :src="playSrc" @callback="playerCallback"></video-player>
        </div>
        <!-- 控制组件 -->
        <div class="control-box" v-if="type === 'control'">
            <player-controller @command="handleCommand"></player-controller>
        </div>
        <!-- 回放组件 -->
        <div class="record-box" v-if="type === 'record'">
            <record-controller 
                :records="recordList" 
                @change-date="handleChangeDate"
                @play="handlePlayRecord"></record-controller>
        </div>
    </div>
</template>
  
<script>
const PlayerStatus = {
  PREPARED: 0,
  PLAYING: 1,
  PAUSED: 2,
  STOPED: 3,
  CLOSE: 4
}
import VideoPlayer from "../video";
import PlayerController from "./PlayerController";
import RecordController from "./RecordController";
import ProtocolPluginAPI from "@/api/protocolPlugin"

export default {
    name: "MonitorPlayer",
    components: { VideoPlayer, PlayerController, RecordController },
    props: {
        type: {
            type: [String],
            default: "default"
        },
        device: {
            type: [Object],
            default: () => {return {}}
        }
    },
    data() {
        return {
            oldType: "default",
            playSrc: "",
            // 录像列表
            recordList: [],
            playerStatus: PlayerStatus.PREPARED,
            params: {
                horizonSpeed: "30",
                verticalSpeed: "30",
                zoomSpeed: "30",
            },
        }
    },
    watch: {
        type: {
            handler(newValue) {
                this.$nextTick(() => {
                    const playerBox = document.getElementById("player-box");
                    switch (newValue) {
                        case "control":
                            // 控制
                            playerBox.style && playerBox.style.setProperty("--w", "calc(100% - 100px)");
                            if (this.playerStatus === PlayerStatus.PLAYING && this.oldType === "record") {
                                this.stopPlay(this.callPlayWVP());
                            } else {
                                this.callPlayWVP()
                            }
                            break;
                        case "record":
                            // 回放
                            playerBox.style && playerBox.style.setProperty("--w", "calc(100% - 200px)");
                            if (this.playerStatus === PlayerStatus.PLAYING) {
                                this.stopPlay();
                            }
                            break;
                        default:
                            console.log("default", newValue)
                            // 默认
                            playerBox.style && playerBox.style.setProperty("--w", "100%");
                            if (this.playerStatus === PlayerStatus.PLAYING && this.oldType === "record") {
                                this.stopPlay(this.callPlayWVP());
                            } else {
                                this.callPlayWVP();
                            }
                            break;
                    }
                    this.oldType = newValue;
                })
            },
            immediate: true
        }

    },
    mounted() {
        console.log("mounted", this.type)
        window.addEventListener('beforeunload', e => {
            this.stopPlay();
        }, null);

    },
    beforeDestroy() {
        this.stopPlay();
    },
    methods: {
        /**
         * PTZ控制
         * @param command
         */
        handleCommand(command) {
            this.params.command = command.toLowerCase();
            this.params.horizonSpeed = "30";
            this.params.verticalSpeed = "30";
            this.params.zoomSpeed = "30";

            ProtocolPluginAPI.commandPlayerPTZ(this.params)
                .then(({data}) => {
                    console.log("====video.handleCommand", data);
                })
        },

        /**
         * 获取录像列表
         * @param params
         */
        getRecordList(params) {
            ProtocolPluginAPI.getRecordList(params)
                .then(({data}) => {
                    if (data.code == 200) {
                        this.recordList = data.data.recordList ? data.data.recordList : [];
                    }
                })
        },
        /**
         * 选择日期
         * @param date
         */
        handleChangeDate(date) {
            console.log("handleChangeDate", date)
            const {parent_id, sub_device_addr} = this.device;
            const startTime = date + " 00:00:00";
            const endTime = date + " 23:59:59"
            this.getRecordList({ parent_id, sub_device_addr,  startTime, endTime});
        },
        /**
         * 播放录像
         * @param record
         */
        handlePlayRecord(record) {
            if (this.playDisabled) return;
            const playFunc = () => {
                const {parent_id, sub_device_addr} = this.device;
                const { startTime, endTime } = record;
                const params = { parent_id, sub_device_addr, startTime, endTime }

                ProtocolPluginAPI.getRecordURL(params)
                    .then(({data}) => {
                        if (data.code == 200) {
                            let result = data.data;
                            this.playSrc = result.flv;
                            this.playDisabled = false;
                        }
                    })
            }
            this.playDisabled = true;
            this.stopPlay(playFunc);
        },
        /**
         * 播放器状态回调
         * @param e
         */
        playerCallback(e) {
            switch (e) {
                case "play": {
                    this.playerStatus = PlayerStatus.PLAYING;
                    break;
                }
                case "videoTimestamp": {
                    this.playerStatus = PlayerStatus.PLAYING;
                    break;
                }
                case "stop": {
                    this.playerStatus = PlayerStatus.STOPED;
                    break;
                }
                default: {
                    this.playerStatus = PlayerStatus.PREPARED;
                }
            }
        },
        /**
         * 开始播放
         */
        play() {
            this.$refs.videoPlayer.play();
        },
        /**
         * 停止播放录像
         * @param callback
         */
        stopPlay(call) {
            const {parent_id, sub_device_addr} = this.device;
            this.playSrc = "";
            ProtocolPluginAPI.stopRecordPlay({parent_id, sub_device_addr})
                .then(({data}) => {
                    call && call();
                })
        },
        /**
         * 播放WVP直播流
         */
        callPlayWVP() {
            const { parent_id, sub_device_addr } = this.device;
            ProtocolPluginAPI.callPlayWVP({ parent_id, sub_device_addr })
                .then(({data}) => {
                    if (data.code == 200) {
                        let result = data.data.data;
                        this.playSrc = result.flv;
                        this.play();
                    }
                })
        },
    }
}
</script>
  
<style scoped lang="scss">
.video-control-container {
    width: 100%;
    height: 100%;

    .player-box {
        display: table;
        float: left;
        width: var(--w);

        .player {
            display: table-cell;
            vertical-align: middle;
        }
    }

    .control-box {
        float: right;
        width: 100px;
        height: 100%;
        background-color: #2c3e50;
    }
    .record-box {
        float: right;
        width: 200px;
        height: 100%;
        background-color: #2c3e50;
    }
}</style>