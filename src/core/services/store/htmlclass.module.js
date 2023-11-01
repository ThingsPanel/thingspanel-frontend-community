/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-07-31 10:24:33
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-10-31 17:34:21
 * @FilePath: \ThingsPanel-Backend-Vue\src\core\services\store\htmlclass.module.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// action types
export const ADD_BODY_CLASSNAME = "addBodyClassName";
export const REMOVE_BODY_CLASSNAME = "removeBodyClassName";
export const ADD_CLASSNAME = "addClassName";
// mutation types
export const SET_CLASSNAME_BY_POSITION = "setClassNameByPosition";

export default {
  state: {
    classes: {}
  },
  getters: {
    getClasses: state => position => {
      if (typeof position !== "undefined") {
        return state.classes[position];
      }
      return state.classes;
    }
  },
  actions: {
    [ADD_BODY_CLASSNAME](context, className) {
      document.body.classList.add(className);
    },
    [REMOVE_BODY_CLASSNAME](context, className) {
      document.body.classList.remove(className);
    },
    [ADD_CLASSNAME](context, payload) {
      context.commit(SET_CLASSNAME_BY_POSITION, payload);
    }
  },
  mutations: {
    [SET_CLASSNAME_BY_POSITION](state, payload) {
      const { position, className } = payload;
      if (!state.classes[position]) {
        state.classes[position] = [];
      }
      state.classes[position].push(className);
    }
  }
};
