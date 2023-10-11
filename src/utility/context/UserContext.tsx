import { createContext } from "react";
import { UserType } from "../types/UserTypes";

export const UserContext = createContext<{
  user: UserType | null, 
  setUser: (user: UserType | null) => void
} >({
  user: null,
  setUser: () => {},
});