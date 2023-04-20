const PERMISSIONS = "permissions";
const NAVS = "navs";

const getPermissions = () => {
    return JSON.parse(localStorage.getItem(PERMISSIONS)) || null;
}

const savePermissions = (permissions) => {
    if (permissions) {
        localStorage.setItem(PERMISSIONS, JSON.stringify(permissions));
    }
}

const clearPermissions = () => {
    localStorage.removeItem(PERMISSIONS);
}

export default { getPermissions, savePermissions, clearPermissions}
