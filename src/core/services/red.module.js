import Vue from 'vue'
import Vuex from "vuex";
import {getRedLogin} from "@/api/transpond";

Vue.use(Vuex);

const TOKEN_KEY = "red_token";
const TOKEN_EXPIRED_KEY = "expires_in";
const TOKEN_TYPE_KEY = "token_type";


export default new Vuex.Store({
    state: {
        TOKEN_KEY: "",
        TOKEN_EXPIRED_KEY: 604800,
        TOKEN_TYPE_KEY: "Bearer"
    },
    mutations: {
        setRedToken(state, val) {
            state.TOKEN_KEY = val.access_token;
            state.TOKEN_EXPIRED_KEY = val.expires_in;
            state.TOKEN_TYPE_KEY = val.token_type;
            window.localStorage.setItem(TOKEN_KEY, val);
        },
        getRedToken(state) {
            var red_token = window.localStorage.getItem(TOKEN_KEY);
            state.TOKEN_KEY = red_token;
        },
        removeRedToken(state) {
            state.red_token = "";
            window.localStorage.removeItem(TOKEN_KEY);
        }
    },
    actions: {}
});