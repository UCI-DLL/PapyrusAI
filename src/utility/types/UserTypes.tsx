export type UserType = {
  email: string;
  email_verified: string;
  family_name: string;
  groups: Array<string>;
  name: string;
  sub: string; //username
  "custom:theme": string;
  "custom:textSize": string;
  "custom:language": string;
  username: string;
};

export type CustomUserType = {
  username: string;
  email: string;
  family_name: string;
  name: string;
  sub: string;
};

export type UserStarred = {
  id: string; //username
  organization: string;
  courses?: Array<{ courseId: string }>;
  modules?: Array<{ courseId: string; moduleId: string }>;
  folders?: Array<{ folderId: string }>;
  prompts?: Array<{ folderId: string; promptId: string }>;
  files?: Array<{ folderId: string; fileId: string }>;
};
