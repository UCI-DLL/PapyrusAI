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
  continuedInteraction: boolean,
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
}