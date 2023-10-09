const axios = require("axios");
const MockAdapter = require("axios-mock-adapter");
const navs = require("./navs.json")
const permissions = require("./permissions.json")

const MockService = {
  init() {
    let mock = new MockAdapter(axios);
    mock.onGet("/menu/getAllNavs").reply(200, navs)
    mock.onGet("/menu/getPermissions").reply(200, permissions)
    console.error("mock init")
  }
};

export default MockService;
