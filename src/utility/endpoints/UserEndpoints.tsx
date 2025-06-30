

//Get current user's data
export function getUserData(username?: string) {
  // get other user data
  if (username) {
    return `user?username=${username}&organization=${process.env.REACT_APP_ORGANIZATION}`;
  } else {
    return `user?organization=${process.env.REACT_APP_ORGANIZATION}`;
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

export function getUserFavoritingData() {
  return `user/data?organization=${process.env.REACT_APP_ORGANIZATION}`
}

export function postCreateUserFavoritingData() {
  return `user/data?organization=${process.env.REACT_APP_ORGANIZATION}`
}

export function putUpdateUserFavoritingData() {
  return `user/data?organization=${process.env.REACT_APP_ORGANIZATION}`
}