<template>
    <div class="v-application card no-border top" data-app="true">
        <v-snackbar
                v-model="snackbar"
                :top="istop"
                :vertical="vertical"
        >
            {{ text }}

            <template v-slot:action="{ attrs }">
                <v-btn
                        color="indigo"
                        text
                        v-bind="attrs"
                        @click="snackbar = false"
                >
                    Close
                </v-btn>
            </template>
        </v-snackbar>
        <v-form
                ref="form"
                v-model="valid"
                lazy-validation
                @submit.stop.prevent="onSubmit"
                class="width-100"
        >
            <v-card class="card no-border text-white">
                <v-card-title>
                    <span class="headline font-size-h3">{{ $t("COMMON.CHANGEPASSWORD") }}</span>
                </v-card-title>
                <v-card-text>
                    <v-container>
                        <v-col cols="6">
                            <v-row>
                            <v-col cols="4" class="v-middle-80 text-white">
                                {{ $t("COMMON.NEWPASSWORD") }}：
                            </v-col>
                            <v-col cols="8">
                                <v-text-field
                                        v-model="password"
                                        label="password"
                                        required
                                        :rules="[passwordRules]"
                                ></v-text-field>
                            </v-col>
                            <v-col cols="4" class="v-middle-80 text-white">
                                {{ $t("COMMON.CONPASSWORD") }}：
                            </v-col>
                            <v-col cols="8">
                                <v-text-field
                                        v-model="conpassword"
                                        label="conpassword"
                                        required
                                        :rules="[conpasswordRules]"
                                ></v-text-field>
                            </v-col>
                        </v-row>
                        </v-col>
                    </v-container>
                </v-card-text>

                <v-btn
                    color="primary"
                    dark
                    class="ml-6 mb-8"
                    @click="onSubmit"
                >{{ $t("COMMON.SUBMIT") }}</v-btn>
            </v-card>
        </v-form>
    </div>
</template>
<style>
    .width-100{width: 100%;}
    .v-middle-80{line-height: 80px;}
</style>
<script>
import { REGISTER } from "@/core/services/store/auth.module";
import { UPDATE_USER } from "@/core/services/store/auth.module";
import { LOGIN, LOGOUT } from "@/core/services/store/auth.module";
import AUTH from "@/core/services/store/auth.module";
import ApiService from "@/core/services/api.service";
export default {
    data() {
        return {
            istop:true,
            valid: true,
            conpassword:'',
            password:'',
            userid:'',
            text:'',
            vertical: true,
            snackbar:false,
        };
    },
    created() {
        this.userid = AUTH.state.userid;
    },
    mounted () {
    },
    methods: {
        passwordRules(v){
            if (v === undefined) {
                return this.$t('COMMON.TITLE3');
            }else if(v.length<6){
                return this.$t('COMMON.PLACEHOLDER24');
            }else {
                return true;
            }
        },
        conpasswordRules(val) {
            if (val !== this.password) {
                return this.$t('COMMON.TITLE14');
            }
            return true;
        },
        onSubmit(){
            var _this = this;
            var validate = this.$refs.form.validate();
            if(validate == true){
                ApiService.post(AUTH.local_url+"/user/update", {
                    id: _this.userid,
                    password: _this.password,
                    password_confirmation: _this.conpassword
                })
                    .then(({ data }) => {
                        if(data.code==200){
                            _this.text='修改成功！';
                            _this.snackbar = true;
                            setTimeout(function(){
                                _this.$store
                                    .dispatch(LOGOUT)
                                    .then(() => _this.$router.push({ name: "login" }));

                            },2000);
                        }else if(data.code == 401) {
                            _this.$store
                                .dispatch(LOGOUT)
                                .then(() => _this.$router.push({ name: "login" }));
                        }else{

                        }
                    });
            }
        }
    },
};
</script>