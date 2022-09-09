const ROUTERS = "routers";

const getRouters = () => {
    return JSON.parse(localStorage.getItem(ROUTERS)) || null;
}

const saveRouters = (routers) => {
    if (routers) {
        localStorage.setItem(ROUTERS, JSON.stringify(routers));
    }
}

const clearRouters = () => {
    localStorage.removeItem(ROUTERS);
}

export default { getRouters, saveRouters, clearRouters}
