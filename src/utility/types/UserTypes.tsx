

export type UserType = {
  email: string;
  email_verified: string,
  family_name: string,
  groups: Array<string>,
  name: string,
  sub: string, //username
  "custom:theme": string,
  username: string,
}

export type CustomUserType = {
  username: string;
  email: string,
  family_name: string,
  name: string,
  sub: string,
}

