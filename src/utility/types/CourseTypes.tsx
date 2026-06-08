import { CustomUserType } from "./UserTypes"

export type LibraryItem = {
  itemId: string;
  name: string;
  description?: string;
  type: "folder" | "prompt" | "file" | "rubric";
  parentId: string;
  ownerId: string; // "ORG" or username
  organization: string;
  createdAt: number; // ms epoch
  updatedAt: number; // ms epoch
  metadata: Record<string, any>;
}

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

//These are used in adding assets to a module
export type PromptType = {
  id: string,
  isDeleted: boolean,
  name: string,
  prompt: string,
}

export type FileType = {
  id: string,
  isDeleted: boolean,
  name: string,
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

