<template>
    <div class="rounded p-4 card no-border v-application" data-app="true">
        <v-row class="">
            <v-col cols="12" xs="12" md="2">
                <el-select v-model="entity_id" :popper-append-to-body="false" class="width-100">
                    <el-option
                            v-for="(e, index) in equlist"
                            :key="index"
                            :value="e.id"
                            :label="e.name"></el-option>
                </el-select>
            </v-col>
            <v-col cols="12" xs="12" md="2">
                <el-select v-model="type" :popper-append-to-body="false" class="width-100">
                    <el-option
                            v-for="(t, index) in typelist"
                            :key="index"
                            :value="t.id"
                            :label="t.name"></el-option>
                </el-select>
            </v-col>
            <v-col cols="12" xs="12" md="2">
                <date-picker type="datetime" class="datepickers strdate" v-model="start_time" locale="zh-cn" format="YYYY-M-D HH:mm:ss" :locale-config="localeConfig"  auto-submit></date-picker>
            </v-col>
            <v-col cols="12" xs="12" md="2">
                <date-picker type="datetime" class="datepickers enddate" v-model="end_time" locale="zh-cn" format="YYYY-M-D HH:mm:ss" :locale-config="localeConfig"  auto-submit></date-picker>
            </v-col>
            <v-col cols="12" xs="12" md="1">
                <v-btn color="primary" @click="ajaxdata">搜索</v-btn>
            </v-col>
<!--            <v-col cols="12" xs="12" md="1">-->
<!--                <v-btn color="primary" @click="exportdata">导出</v-btn>-->
<!--            </v-col>-->
        </v-row>
        <v-data-table
                :headers="headers"
                :hide-default-header="hideheader"
                :items="desserts"
                sort-by="calories"
                class="no-bg text-white"
                hide-default-footer
        >
            <template
                    v-slot:header="{ props: { headers } }"
            >
                <thead>
                <tr>
                    <th v-for="(header,h) in headers" class="text-white" :class="h==3?'text-center width-300':''">
                        {{$t(header.text)}}
                    </th>
                </tr>
                </thead>
            </template>
            <template v-slot:item.name="{ item }">
                <router-link :to="{ path: 'strlist', query: { id: item.id }}" class="text-white">{{ item.name }}</router-link>
            </template>
        </v-data-table>
        <v-pagination
                class="float-right"
                v-model="page"
                :circle="circle"
                :disabled="disabled"
                :length="length"
                :page="page"
                :total-visible="limit"
                @input="pageChange"
        ></v-pagination>
        <div style="clear:both"></div>
    </div>
</template>
<style scoped>
    .v-application .text-start{text-align: center !important;}
    table td{vertical-align: middle;}
    .v-application{display: block;}
    .v-middle-80 {
        line-height: 80px;
    }
    .v-pagination .primary {
        background-color: #1867c0 !important;
        border-color: #1867c0 !important;
    }
    .sel-width{width: 150px;}
</style>

<script>
    import { mapState } from "vuex";
    import { REGISTER } from "@/core/services/store/auth.module";
    import { UPDATE_USER } from "@/core/services/store/auth.module";
    import { LOGIN, LOGOUT } from "@/core/services/store/auth.module";
    import AUTH from "@/core/services/store/auth.module";

    import ApiService from "@/core/services/api.service";
    import Hits from '@/assets/js/components/com.js';
    export default {
        data: () => ({
            hideheader:true,
            seen: true,
            length: 3,
            circle: false,
            disabled: false,
            limit: 15,
            page: 1,
            headers: [
                { text: "设备类型", class:'text-white',value: "entity_type" },
                { text: "设备key",class:'text-white', value: "key" },
                { text: "时间",class:'text-white',value: "ts" },
                { text: "设备ID",class:'text-white',value: "entity_id" },
                { text: "设备值",class:'text-white',value: "dbl_v" }
            ],
            desserts: [],
            entity_id:'',
            type:4,
            equlist:[],
            typelist:[{id:1,name:'今日数据'},{id:2,name:'本周数据'},{id:3,name: '本月数据'},{id:4,name:'自定义'}],
            localeConfig: {
                'zh-cn': {
                    dow: 0,
                    dir: 'ltr',
                    lang: {
                        label: 'ZH-CN',
                        submit: '确定',
                        cancel: '取消',
                        now: '现在'
                    }
                }
            },
            start_time:'',
            end_time:'',
        }),

        created() {
            // this.initialize();
            var data = new Date();
            var month =data.getMonth() < 9 ? "0" + (data.getMonth() + 1) : data.getMonth() + 1;
            var date = data.getDate() <= 9 ? "0" + data.getDate() : data.getDate();
            console.log(data.getHours());
            var hour = data.getHours() <= 9 ? "0" + data.getHours() : data.getHours();
            var minute = data.getMinutes() <= 9 ? "0" + data.getMinutes() : data.getMinutes();
            var second = data.getSeconds() <= 9 ? "0" + data.getSeconds() : data.getSeconds();
            var days = 7;
            var newDate = new Date(Date.now() - days*24*60*60*1000);
            var endmonth = newDate.getMonth() < 9 ? "0" + (newDate.getMonth() + 1) : newDate.getMonth() + 1;
            var enddate = newDate.getDate() <= 9 ? "0" + newDate.getDate() : newDate.getDate();
            var enddates = data.getFullYear()+'-'+month+'-'+date+' '+hour+':'+minute+':'+second;
            var startdate = newDate.getFullYear()+'-'+endmonth+'-'+enddate+' '+hour+':'+minute+':'+second;
            this.start_time = startdate;
            this.end_time = enddates;
            console.log(this.start_time);

            this.equdata();
            this.ajaxdata();
        },

        methods: {
            equdata(){
                ApiService.post(AUTH.local_url+"/kv/list")
                    .then(({ data }) => {
                        console.log('设备列表');
                        console.log(data);
                        if (data.code == 200) {
                            this.equlist = data.data;
                        }else if(data.code == 401) {
                            this.$store
                                .dispatch(LOGOUT)
                                .then(() => this.$router.push({ name: "login" }));
                        }else{

                        }
                    });
            },
            ajaxdata() {
                ApiService.post(AUTH.local_url+"/kv/index",{limit:this.limit,page:this.page,entity_id:this.entity_id,type:this.type,start_time:this.start_time,end_time:this.end_time})
                    .then(({ data }) => {
                        console.log('数据管理列表');
                        console.log(data);
                        if (data.code == 200) {
                            console.log(data.data.data.length);
                            this.desserts = data.data.data;
                            this.length = data.data.last_page;
                        }else if(data.code == 401) {
                            this.$store
                                .dispatch(LOGOUT)
                                .then(() => this.$router.push({ name: "login" }));
                        }else{

                        }
                    });
            },

            pageChange() {
                this.ajaxdata();
            },
            exportdata(){
                ApiService.post(AUTH.local_url+"/kv/export",{entity_id:this.entity_id,type:this.type,start_time:this.start_time,end_time:this.end_time})
                    .then(({ data }) => {
                        console.log('导出');
                        console.log(data);
                        if (data.code == 200) {
                            console.log('导出成功');
                            console.log(document.location.hostname+'/'+data.data);
                            window.open(data.data, '_blank');
                        }else if(data.code == 401) {
                            this.$store
                                .dispatch(LOGOUT)
                                .then(() => this.$router.push({ name: "login" }));
                        }else{

                        }
                    });
            },
        }
    };
</script>
