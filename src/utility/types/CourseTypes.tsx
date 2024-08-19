import { CustomUserType } from "./UserTypes"


export type CourseType = {
  name: string,
  createdTimestamp: string,
  id: string,
  isActive: boolean,
  isDeleted: boolean,
  modules: Array<ModuleType>,
  organization: string,
  signUpCode: string,
  instructor: CustomUserType,
  year: string,
  term: string,
  section: string,
  taList?: Array<CustomUserType>,
}

export type ModuleType = {
  continuedInteraction: boolean, //deprecated
  id: string,
  isDeleted: boolean,
  isPublished: boolean,
  isRepeating: boolean,
  isTemplate: boolean,
  moduleDescription: string,
  name: string,
  prompts: Array<PromptType>,
  showInitialPrompt: boolean,
  showWizard: boolean,
}
//Note: the difference between this folder/prompt and the old prompt type is 
//old one has organization
//new one has isOrganizationPrompt and folderId
export type PromptType = {
  id: string,
  creator: CustomUserType,
  isDeleted: boolean,
  name: string,
  prompt: string,
  tags: Array<string>,
  isOrganizationPrompt: boolean,
  folderId?: string,
}

export type FileType = {
  id: string,
  creator: CustomUserType,
  isDeleted: boolean,
  name: string,
  file: string, // url of file
  tags: Array<string>,
  isOrganizationFile: boolean,
  fileId?: string, //file id as input to backend vs id is output from backend
  timestamp: string, //TODO in backend
  folderId?: string,
}

export type FolderType = {
  id: string,
  creator: CustomUserType,
  userId?: string, //if folder is user type
  organization: string,
  timestamp: string,
  isDeleted: boolean,
  name: string,
  prompts: Array<PromptType>,
  files: Array<FileType>,
}

export type TagType = {
  id: string,
  isDeleted: boolean,
  organization: string,
  name?: string, //this is a placeholder for updating the tag to a new name
}