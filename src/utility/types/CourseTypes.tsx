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
  instructor: CustomUserType
}

export type ModuleType = {
  continuedInteraction: boolean,
  documents: Array<any>,
  id: string,
  isDeleted: boolean,
  isPublished: boolean,
  isRepeating: boolean,
  isTemplate: boolean,
  moduleDescription: boolean,
  name: string,
  prompts: Array<any>,
  showInitialPrompt: boolean,
  showWizard: boolean,
}

export type DocumentType = {
  documentType: string,
  usageText: string
}

export type PromptType = {
  id: string,
  creator: CustomUserType,
  isDeleted: boolean,
  name: string,
  prompt: string,
}