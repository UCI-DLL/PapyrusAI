

export function getCourseList() {
  return `/course`;
}

export function postCreateCourse() {
  return `/course`;
}

export function getCourse(courseId: string) {
  return `/course/${courseId}`;
}

export function putUpdateCourse(courseId: string) {
  return `/course/${courseId}`;
}

export function putCreateModule(courseId: string) {
  return `/course/${courseId}/module`;
}

export function getModule(courseId: string, moduleId: string) {
  return `/course/${courseId}/module/${moduleId}`;
}

export function putUpdateModule(courseId: string, moduleId: string) {
  return `/course/${courseId}/module/${moduleId}`;
}

export function postAddUserToCourseGroup() {
  return `/course/user`;
}

export function getUsersInCourse(courseId: string) {
  return `/course/${courseId}/users`;
}