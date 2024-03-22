

export function getCourseList() {
  return `course?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postCreateCourse() {
  return `course?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function getCourse(courseId: string) {
  return `course/${courseId}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function putUpdateCourse(courseId: string) {
  return `course/${courseId}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function putCreateModule(courseId: string) {
  return `course/${courseId}/module?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function getModule(courseId: string, moduleId: string) {
  return `course/${courseId}/module/${moduleId}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function putUpdateModule(courseId: string, moduleId: string) {
  return `course/${courseId}/module/${moduleId}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postAddUserToCourseGroup() {
  return `course/user?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function getUsersInCourse(courseId: string) {
  return `/course/${courseId}/users`;
}