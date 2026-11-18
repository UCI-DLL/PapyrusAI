

//Get current user's data
export function getUserData(username?: string, isAdminPanel?: boolean) {
  const org = isAdminPanel ? "AdminPanel" : process.env.REACT_APP_ORGANIZATION;
  if (username) {
    return `user?username=${username}&organization=${org}`;
  } else {
    return `user?organization=${org}`;
  }
}

export function postUserData() {
  return `user?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function getUserList(limit?: number, PaginationToken: string = "") {
  if (limit) {
    return `user/list?limit=${limit}&paginationToken=${PaginationToken}&organization=${process.env.REACT_APP_ORGANIZATION}`;
  } else {
    return `user/list?organization=${process.env.REACT_APP_ORGANIZATION}`;
  }
}

function getUserOrg(): string {
  return localStorage.getItem("papyrusai_is_admin_panel_user") === "true"
    ? "AdminPanel"
    : process.env.REACT_APP_ORGANIZATION ?? "";
}

export function getUserFavoritingData() {
  return `user/data?organization=${getUserOrg()}`
}

export function postCreateUserFavoritingData() {
  return `user/data?organization=${getUserOrg()}`
}

export function putUpdateUserFavoritingData() {
  return `user/data?organization=${getUserOrg()}`
}

export function logEvent() {
  return `data/log?organization=${process.env.REACT_APP_ORGANIZATION}`
}