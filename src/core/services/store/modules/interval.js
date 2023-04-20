export default {
    state: {
        timers: {}
    },
    getters: {
      getTimers(state, getters) {
          return (id) => {
              return state.timers[id];
          }
      },
        getAll(state) {
          return state.timers;
        }
    },
    mutations: {
        addTimer(state, item) {
            state.timers[item.id] = item.timer;
        },
        delTimer(state, item) {
            delete state.timers[item.id];
        }
    }
}