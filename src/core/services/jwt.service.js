import storage from "../../storage";

const ID_TOKEN_KEY = "id_token";
const TOKEN_EXPIRES_KEY = "id_token_expires_in";
const USER = "user";
const AI_CONVERSATION = "chatHistory";
const ls = window.localStorage;

export const getCurrentUser = () => {
  return JSON.parse(ls.getItem(USER));
}

export const saveCurrentUser = (user) => {
  ls.setItem(USER, JSON.stringify(user));
}
export const removeCurrentUser = () => {
  ls.removeItem(USER);
  ls.removeItem(AI_CONVERSATION);
}

export const getToken = () => {
  // console.log('jwt_service_get_token')
  return window.localStorage.getItem(ID_TOKEN_KEY);
};

export const saveToken = (token) => {
  window.localStorage.setItem(ID_TOKEN_KEY, token);
};

export const destroyToken = () => {
  window.localStorage.removeItem(ID_TOKEN_KEY);
  window.localStorage.removeItem(TOKEN_EXPIRES_KEY);
  window.localStorage.removeItem(AI_CONVERSATION);
};

export const getExpiresTime = () => {
  return window.localStorage.getItem(TOKEN_EXPIRES_KEY);
}

export const saveExpiresTime = (time) => {
  let expires_in = Date.now() + time * 1000; // 秒转毫秒
  window.localStorage.setItem(TOKEN_EXPIRES_KEY, expires_in.toString());
}



export default { getCurrentUser, saveCurrentUser, removeCurrentUser,
  ID_TOKEN_KEY, getToken, saveToken, destroyToken, saveExpiresTime, getExpiresTime,
};
