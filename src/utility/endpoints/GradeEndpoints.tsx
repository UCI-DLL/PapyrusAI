
export function getGrades(courseId: string, moduleId: string) {
  return `grades/${courseId}/${moduleId}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postReleaseAllGrades(courseId: string, moduleId: string) {
  return `grades/${courseId}/${moduleId}/release-all?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function getGrade(courseId: string, moduleId: string, username: string, conversationId: string) {
  return `grades/${courseId}/${moduleId}/${username}/${conversationId}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function putUpdateGrade(courseId: string, moduleId: string, username: string, conversationId: string) {
  return `grades/${courseId}/${moduleId}/${username}/${conversationId}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postRegrade() {
  return `grades/regrade?organization=${process.env.REACT_APP_ORGANIZATION}`;
}
