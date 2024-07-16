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

export type PromptType = {
  id: string,
  creator: CustomUserType,
  isDeleted: boolean,
  name: string,
  prompt: string,
  tags?: Array<string>,
}

export type FolderType = {
  id: string,
  creater: CustomUserType,
  organization: string,
  timestamp: string,
  isDeleted: boolean,
  name: string,
  prompts: Array<PromptType>,
}

export type TagType = {
  id: string,
  isDeleted: boolean,
  organization: string,
  name?: string, //this is a placeholder for updating the tag to a new name
}