import { createContext } from "react";
// import { v3UserType } from "../Types"

export const UserContext = createContext<{
  user: any | null, //TODO type
  setUser: (user: any | null) => void
} >({
  user: null,
  setUser: () => {},
});