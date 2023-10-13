

export function getConversationList(courseId: string, moduleId: string) {
  return `/conversation/${courseId}/${moduleId}`;
}

export function postCreateConversation(courseId: string, moduleId: string) {
  return `/conversation/${courseId}/${moduleId}`;
}

export function getConversation(courseId: string, moduleId: string, index: string) {
  return `/conversation/${courseId}/${moduleId}/${index}`;
}

//The list of all conversations for a user
export function getUserConversationList(username: string) {
  return `/conversation/user/${username}`;
}