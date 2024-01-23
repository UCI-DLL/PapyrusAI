

//Get current user's data
export function getUserData(username?: string) {
  // get other user data
  if(username) {
    return `/user?username=${username}`;
  } else {
    return `/user`;
  }
}

export function postUserData() {
  return `/user`;
}

export function getUserList(limit?: number, PaginationToken: string = "") {
  if(limit) {
    return `/user/list?limit=${limit}&paginationToken=${PaginationToken}`;
  } else {
    return `/user/list`;
  }
}