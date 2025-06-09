

export function getCourseList() {
  return `course?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function getAllCourseList(limit?: number, startKey: string = "") {
  if (limit) {
    return `course/all?limit=${limit}&startKey=${startKey}&organization=${process.env.REACT_APP_ORGANIZATION}`
  } else {
    return `course/all?organization=${process.env.REACT_APP_ORGANIZATION}`;
  }
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

export function getUsersInCourse(courseId: string, limit?: number, nextToken: string = "") {
  if (limit) {
    return `course/${courseId}/users?limit=${limit}&nextToken=${nextToken}&organization=${process.env.REACT_APP_ORGANIZATION}`
  } else {
    return `course/${courseId}/users?organization=${process.env.REACT_APP_ORGANIZATION}`;
  }

}

export function postCopyCourse(courseId: string) {
  return `course/${courseId}/copy?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function putCopyModule(courseId: string, moduleId: string, copyToCourseId: string) {
  return `course/${courseId}/module/${moduleId}/copy/${copyToCourseId}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function getRaterModuleData(courseId: string, moduleId: string) {
  return `course/${courseId}/module/${moduleId}/rater?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function getAllMessages(courseIds: string[], lastKeyId?: string|undefined, lastModuleId?: string|undefined): string {
  let url = `data?organization=${process.env.REACT_APP_ORGANIZATION}`;
  if (lastKeyId && lastModuleId) {
    url += `&LastEvaluatedKeyId=${lastKeyId}&LastEvaluatedKeyModuleId=${lastModuleId}`;
  }
  for (const id of courseIds) {
    url += `&courseId=${id}`;
  }
  return url;
}