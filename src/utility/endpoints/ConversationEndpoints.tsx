

export function getConversationList(courseId: string, moduleId: string, username?: string) {
  if(username) {
    return `/conversation/${courseId}/${moduleId}?username=${username}`; 
  } else {
    return `/conversation/${courseId}/${moduleId}`;
  }
}

export function postCreateConversation(courseId: string, moduleId: string) {
  return `/conversation/${courseId}/${moduleId}`;
}

export function getConversation(courseId: string, moduleId: string, index: string, username?: string) {
  if(username) {
    return `/conversation/${courseId}/${moduleId}/${index}?username=${username}`; 
  } else {
    return `/conversation/${courseId}/${moduleId}/${index}`;
  }
}

//The list of all conversations for a user
export function getUserConversationList(username: string, limit?: number, startKeyCourse: string = "", startKeyModule: string = "") {
  //TODO handle pagination
  if(limit && startKeyCourse && startKeyModule) {
    return `/conversation/user/${username}?limit=${limit}&startKeyCourse=${startKeyCourse}&startKeyModule=${startKeyModule}`;
  } else {
    return `/conversation/user/${username}`;
  }
  
}