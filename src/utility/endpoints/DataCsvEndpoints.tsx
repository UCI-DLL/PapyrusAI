

export function getAllData2(courseIds: string[], lastKeyId?: string|undefined, lastModuleId?: string|undefined): string {
  let url = `data?organization=${process.env.REACT_APP_ORGANIZATION}`;
  if (lastKeyId && lastModuleId) {
    url += `&LastEvaluatedKeyId=${lastKeyId}&LastEvaluatedKeyModuleId=${lastModuleId}`;
  }
  for (const id of courseIds) {
    url += `&courseId=${id}`;
  }
  return url;
}