

export function getTagList(limit?: number, startKey: string = "") {
  if (limit) {
    return `tag?limit=${limit}&startKey=${startKey}&organization=${process.env.REACT_APP_ORGANIZATION}`
  } else {
    return `tag?organization=${process.env.REACT_APP_ORGANIZATION}`;
  }
}

export function postCreateTag() {
  return `tag?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function getTag(id: string) {
  return `tag/${id}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function updateTag(id: string) { //id is old tag name. pass in {id, name} id is old tag, name is new tag
  return `tag/${id}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}