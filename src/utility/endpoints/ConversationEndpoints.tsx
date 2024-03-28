

export function getConversationList(courseId: string, moduleId: string, username?: string) {
  if (username) { 
    return `conversation/${courseId}/${moduleId}?username=${username}&organization=${process.env.REACT_APP_ORGANIZATION}`;
  } else {
    return `conversation/${courseId}/${moduleId}?organization=${process.env.REACT_APP_ORGANIZATION}`;
  }
}

export function postCreateConversation(courseId: string, moduleId: string) {
  return `conversation/${courseId}/${moduleId}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postUpdateConversation(courseId: string, moduleId: string, index: string) {
  return `conversation/${courseId}/${moduleId}/${index}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function getConversation(courseId: string, moduleId: string, index: string, username?: string) {
  if (username) {
    return `conversation/${courseId}/${moduleId}/${index}?username=${username}&organization=${process.env.REACT_APP_ORGANIZATION}`;
  } else {
    return `conversation/${courseId}/${moduleId}/${index}?organization=${process.env.REACT_APP_ORGANIZATION}`;
  }
}

//The list of all conversations for a user
export function getUserConversationList(username: string, limit?: number, startKeyCourse: string = "", startKeyModule: string = "") {
  //TODO handle pagination
  if (limit && startKeyCourse && startKeyModule) {
    return `conversation/user/${username}?limit=${limit}&startKeyCourse=${startKeyCourse}&startKeyModule=${startKeyModule}&organization=${process.env.REACT_APP_ORGANIZATION}`;
  } else {
    return `conversation/user/${username}?organization=${process.env.REACT_APP_ORGANIZATION}`;
  }

}