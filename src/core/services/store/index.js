import Vue from "vue";
import Vuex from "vuex";

import auth from "./auth.module";
import htmlClass from "./htmlclass.module";
import config from "./config.module";
import breadcrumbs from "./breadcrumbs.module";
import appStore from "./app-store.module"; 

import app from './modules/app';
import errorLog from './modules/errorLog';
import interval from './modules/interval'
import getters from './getters';
import red from '../red.module'

Vue.use(Vuex);

const store =  new Vuex.Store({
    modules: {
        auth,
        htmlClass,
        config,
        breadcrumbs,
        appStore,
        app,
    	errorLog,
        interval,
        red
    },
    getters,
});

export const useStore = () => store;

export default store;
