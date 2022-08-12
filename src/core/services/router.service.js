const ROUTERS = "routers";

const getRouters = () => {
    return JSON.parse(localStorage.getItem(ROUTERS)) || null;
}

const saveRouters = (routers) => {
    console.log("================saveRouters===============");
    console.log(routers);
    if (routers) {
        localStorage.setItem(ROUTERS, JSON.stringify(routers));
        console.log("================setItem===============");

    }
}

const clearRouters = () => {
    localStorage.removeItem(ROUTERS);
}

export default { getRouters, saveRouters, clearRouters}
