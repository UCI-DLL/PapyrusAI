

export function getOrgPermissionsList(limit?: number, startKey: string = "") {
  if (limit) {
    return `org/${process.env.REACT_APP_ORGANIZATION}/permissions?limit=${limit}&startKey=${startKey}&organization=${process.env.REACT_APP_ORGANIZATION}`
  } else {
    return `org/${process.env.REACT_APP_ORGANIZATION}/permissions?organization=${process.env.REACT_APP_ORGANIZATION}`;
  }
}

export function postCreateOrgPermission() {
  return `org/${process.env.REACT_APP_ORGANIZATION}/permissions?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function getOrgPermission(id: string) {
  return `org/${process.env.REACT_APP_ORGANIZATION}/permissions/${id}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function updateOrgPermission(id: string) {
  return `org/${process.env.REACT_APP_ORGANIZATION}/permissions/${id}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}