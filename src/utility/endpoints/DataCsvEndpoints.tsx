

export function getAllData2(courseIds: string[], lastKeyId?: number, lastModuleId?: string) {
  //TODO: Include courseIds into URL
  if (lastKeyId) {
    return `data?organization=${process.env.REACT_APP_ORGANIZATION}&LastEvaluatedKeyId=${lastKeyId}&LastEvaluatedKeyModuleId=${lastModuleId}`
  } else {
    return `data?organization=${process.env.REACT_APP_ORGANIZATION}`;
  }
}

