//Handles org folders, user folders, and anything that is in them

/** Org Folders */
export function getOrgFolderList(limit?: number, startKey: string = "") {
  if (limit) {
    return `org/${process.env.REACT_APP_ORGANIZATION}/folder?limit=${limit}&startKey=${startKey}&organization=${process.env.REACT_APP_ORGANIZATION}`
  } else {
    return `org/${process.env.REACT_APP_ORGANIZATION}/folder?organization=${process.env.REACT_APP_ORGANIZATION}`;
  }
}

export function postCreateOrgFolder() { //(only admin)
  return `org/${process.env.REACT_APP_ORGANIZATION}/folder?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function getOrgFolder(folderid: string) {
  return `org/${process.env.REACT_APP_ORGANIZATION}/folder/${folderid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postUpdateOrgFolder(folderid: string) { //(only admin)
  return `org/${process.env.REACT_APP_ORGANIZATION}/folder/${folderid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postCreateOrgPrompt(folderid: string) { //in a folder //(only admin)
  return `org/${process.env.REACT_APP_ORGANIZATION}/folder/${folderid}/prompt?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function getOrgPrompt(folderid: string, promptid: string) {
  return `org/${process.env.REACT_APP_ORGANIZATION}/folder/${folderid}/prompt/${promptid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postUpdateOrgPrompt(folderid: string, promptid: string) { //(only admin)
  return `org/${process.env.REACT_APP_ORGANIZATION}/folder/${folderid}/prompt/${promptid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

//Copy an org folder into the current user's list of folders
export function postCopyOrgFolder(folderid: string) {
  return `org/${process.env.REACT_APP_ORGANIZATION}/folder/${folderid}/copy?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

//change the org folder to a user folder of the current user (only admin)
export function postDemoteOrgFolder(folderid: string) {
  return `org/${process.env.REACT_APP_ORGANIZATION}/folder/${folderid}/demote?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postCopyOrgPromptToOrgFolder(folderid: string, promptid: string, orgfolderid: string) { //(only admin)
  return `org/${process.env.REACT_APP_ORGANIZATION}/folder/${folderid}/prompt/${promptid}/copy/org/${orgfolderid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postCopyOrgPromptToUserFolder(folderid: string, promptid: string, userfolderid: string) {
  return `org/${process.env.REACT_APP_ORGANIZATION}/folder/${folderid}/prompt/${promptid}/copy/user/${userfolderid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postMoveOrgPromptToOrgFolder(folderid: string, promptid: string, orgfolderid: string) { //(only admin)
  return `org/${process.env.REACT_APP_ORGANIZATION}/folder/${folderid}/prompt/${promptid}/move/org/${orgfolderid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postMoveOrgPromptToUserFolder(folderid: string, promptid: string, userfolderid: string) {
  return `org/${process.env.REACT_APP_ORGANIZATION}/folder/${folderid}/prompt/${promptid}/move/user/${userfolderid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

/** User Folders */
export function getUserFolderList(limit?: number, startKey: string = "") {
  if (limit) {
    return `folder?limit=${limit}&startKey=${startKey}&organization=${process.env.REACT_APP_ORGANIZATION}`
  } else {
    return `folder?organization=${process.env.REACT_APP_ORGANIZATION}`;
  }
}

export function postCreateUserFolder() {
  return `folder?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function getUserFolder(folderid: string) {
  return `folder/${folderid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postUpdateUserFolder(folderid: string) {
  return `folder/${folderid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postCreateUserPrompt(folderid: string) { //in a folder
  return `folder/${folderid}/prompt?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function getUserPrompt(folderid: string, promptid: string) {
  return `folder/${folderid}/prompt/${promptid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postUpdateUserPrompt(folderid: string, promptid: string) {
  return `folder/${folderid}/prompt/${promptid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

//Copy a user folder into the current user's list of folders
export function postCopyUserFolder(folderid: string) {
  return `folder/${folderid}/copy?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

//change the user folder to an org folder (only admin)
export function postPromoteUserFolder(folderid: string) {
  return `folder/${folderid}/promote?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postCopyUserPromptToOrgFolder(folderid: string, promptid: string, orgfolderid: string) { //(only admin)
  return `folder/${folderid}/prompt/${promptid}/copy/org/${orgfolderid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postCopyUserPromptToUserFolder(folderid: string, promptid: string, userfolderid: string) {
  return `folder/${folderid}/prompt/${promptid}/copy/user/${userfolderid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postMoveUserPromptToOrgFolder(folderid: string, promptid: string, orgfolderid: string) { //(only admin)
  return `folder/${folderid}/prompt/${promptid}/move/org/${orgfolderid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postMoveUserPromptToUserFolder(folderid: string, promptid: string, userfolderid: string) {
  return `folder/${folderid}/prompt/${promptid}/move/user/${userfolderid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}





/**
 * RAG stuff
 */

export function getSignedS3BucketUploadOrgFolder(folderId: string) {
  return `ragfile/upload/org/${process.env.REACT_APP_ORGANIZATION}/${folderId}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function getSignedS3BucketUploadUserFolder(folderId: string) {
  return `ragfile/upload/${folderId}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}
/**
 * files in folders
 */
export function postCreateOrgFile(folderid: string) { //in a folder //(only admin)
  return `org/${process.env.REACT_APP_ORGANIZATION}/folder/${folderid}/file?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function getOrgFile(folderid: string, promptid: string) {
  return `org/${process.env.REACT_APP_ORGANIZATION}/folder/${folderid}/file/${promptid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postUpdateOrgFile(folderid: string, promptid: string) { //(only admin)
  return `org/${process.env.REACT_APP_ORGANIZATION}/folder/${folderid}/file/${promptid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

//TODO fix in backend to actually copy the file
export function postCopyOrgFileToOrgFolder(folderid: string, promptid: string, orgfolderid: string) { //(only admin)
  return `org/${process.env.REACT_APP_ORGANIZATION}/folder/${folderid}/file/${promptid}/copy/org/${orgfolderid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}
//TODO fix in backend to actually copy the file
export function postCopyOrgFileToUserFolder(folderid: string, promptid: string, userfolderid: string) {
  return `org/${process.env.REACT_APP_ORGANIZATION}/folder/${folderid}/file/${promptid}/copy/user/${userfolderid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postMoveOrgFileToOrgFolder(folderid: string, promptid: string, orgfolderid: string) { //(only admin)
  return `org/${process.env.REACT_APP_ORGANIZATION}/folder/${folderid}/file/${promptid}/move/org/${orgfolderid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postMoveOrgFileToUserFolder(folderid: string, promptid: string, userfolderid: string) {
  return `org/${process.env.REACT_APP_ORGANIZATION}/folder/${folderid}/file/${promptid}/move/user/${userfolderid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postCreateUserFile(folderid: string) { //in a folder
  return `folder/${folderid}/file?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function getUserFile(folderid: string, promptid: string) {
  return `folder/${folderid}/file/${promptid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postUpdateUserFile(folderid: string, promptid: string) {
  return `folder/${folderid}/file/${promptid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}
//TODO fix in backend to actually copy the file
export function postCopyUserFileToOrgFolder(folderid: string, promptid: string, orgfolderid: string) { //(only admin)
  return `folder/${folderid}/file/${promptid}/copy/org/${orgfolderid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}
//TODO fix in backend to actually copy the file
export function postCopyUserFileToUserFolder(folderid: string, promptid: string, userfolderid: string) {
  return `folder/${folderid}/file/${promptid}/copy/user/${userfolderid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postMoveUserFileToOrgFolder(folderid: string, promptid: string, orgfolderid: string) { //(only admin)
  return `folder/${folderid}/file/${promptid}/move/org/${orgfolderid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function postMoveUserFileToUserFolder(folderid: string, promptid: string, userfolderid: string) {
  return `folder/${folderid}/file/${promptid}/move/user/${userfolderid}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}