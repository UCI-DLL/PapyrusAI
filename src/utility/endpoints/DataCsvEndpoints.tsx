

export function getAllData2(courseIds: string[], lastKeyId?: string, lastModuleId?: string): string {
  let url = `data?organization=${process.env.REACT_APP_ORGANIZATION}`;
  if (lastKeyId) {
    url += `&LastEvaluatedKeyId=${lastKeyId}&LastEvaluatedKeyModuleId=${lastModuleId}`;
  }
  for (const id of courseIds) {
    url += `&courseId=${id}`;
  }
  return url;
}