//Note: All of these endpoints use the second api

const org = () => process.env.REACT_APP_ORGANIZATION;

export function getItems(params?: {
  parentId?: string;
  owner?: string;
  type?: string;
  shared?: boolean;
  nextKey?: string;
}) {
  const base = `items?organization=${org()}`;
  const parts: string[] = [];
  if (params?.parentId) parts.push(`parentId=${params.parentId}`);
  if (params?.owner) parts.push(`owner=${encodeURIComponent(params.owner)}`);
  if (params?.type) parts.push(`type=${params.type}`);
  if (params?.shared) parts.push(`shared=true`);
  if (params?.nextKey) parts.push(`nextKey=${encodeURIComponent(params.nextKey)}`);
  return parts.length ? `${base}&${parts.join("&")}` : base;
}

export function getItem(itemId: string) {
  return `items/${itemId}?organization=${org()}`;
}

export function postCreateItem() {
  return `items?organization=${org()}`;
}

export function patchUpdateItem(itemId: string) {
  return `items/${itemId}?organization=${org()}`;
}

export function deleteItem(itemId: string) {
  return `items/${itemId}?organization=${org()}`;
}

export function postMoveItem(itemId: string) {
  return `items/${itemId}/move?organization=${org()}`;
}

export function postCopyItem(itemId: string) {
  return `items/${itemId}/copy?organization=${org()}`;
}

export function postPromoteItem(itemId: string) {
  return `items/${itemId}/promote?organization=${org()}`;
}

export function postDemoteItem(itemId: string) {
  return `items/${itemId}/demote?organization=${org()}`;
}

export function getItemPermissions(itemId: string) {
  return `items/${itemId}/permissions?organization=${org()}`;
}

export function postItemPermission(itemId: string) {
  return `items/${itemId}/permissions?organization=${org()}`;
}

export function deleteItemPermission(itemId: string, userId: string) {
  return `items/${itemId}/permissions/${encodeURIComponent(userId)}?organization=${org()}`;
}

export function patchItemPermission(itemId: string, userId: string) {
  return `items/${itemId}/permissions/${encodeURIComponent(userId)}?organization=${org()}`;
}
