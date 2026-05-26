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
  raterEnabled?: boolean, //deprecated
  files?: Array<FileType>,
  webSearch?: boolean,
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
  tags: Array<string>,
  isOrganizationFile: boolean,
  folderId?: string,
  hiddenMessageId: string,
  fileReference: string,
}

export type RubricCriterion = {
  name: string,
  cells: Array<string>, // parallel to RubricType.columns — cells[i] belongs to columns[i]
}

export type RubricType = {
  id: string,
  creator: CustomUserType,
  isDeleted: boolean,
  name: string,
  isOrganizationRubric: boolean,
  folderId?: string,
  columns: Array<string>,        // e.g. ["0","1","2","3"] — user-editable labels
  criteria: Array<RubricCriterion>,
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
  rubrics?: Array<RubricType>,   // optional — API doesn't return this yet
}

export type TagType = {
  id: string,
  isDeleted: boolean,
  organization: string,
  name?: string, //this is a placeholder for updating the tag to a new name
}